import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { PendingCharge, PendingChargeDocument } from './schemas/pending-charge.schema';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignMessengerDto } from './dto/assign-messenger.dto';
import { User } from '../users/schemas/user.schema';
import { StoresService } from '../stores/stores.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/types/users.type';
import { StoreStatus } from '../stores/types/store.type';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';
import { OrderStatus, OrderChannel } from './types/orders.type';
import { MoneyUtils } from 'src/common/utils/money.utils';
import { MessengerInDelivery, MessengerInDeliveryDocument } from './schemas/messengers-in-delivery.schema';
import { OrderStateContext } from './state/order-state.context';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryQuoteDto } from '../delivery/dto/delivery-quote.dto';
import { calculateDeliveryCharge } from '../delivery/utils/delivery-calculator';
import { DEFAULT_PRODUCT_INFLUENCE_WEIGHT } from '../delivery/types/delivery.constants';
import { PosSaleDto } from './dto/pos-sale.dto';
import { PosDeliveryQuoteDto } from './dto/pos-delivery-quote.dto';

interface OutOfStockItem {
  productId: string;
  productName?: string;
  availableStock: number;
  requestedQuantity: number;
}

interface StoreGroup {
  storeId: Types.ObjectId;
  items: Array<{
    productId: Types.ObjectId;
    product: any;
    quantity: number;
    selectedOptions: Array<{
      varietyTypeId: string;
      varietyTypeLabel: string;
      optionId: string;
      optionLabel: string;
      priceDelta: number;
    }>;
    selectedAddons: Array<{
      addonId: Types.ObjectId;
      addonLabel: string;
      quantity: number;
      pricePerUnit: number;
      totalPrice: number;
    }>;
    unitPriceCents: number;
  }>;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(PendingCharge.name) private pendingChargeModel: Model<PendingChargeDocument>,
    @InjectModel(MessengerInDelivery.name) private messengerInDelivery: Model<MessengerInDeliveryDocument>,
    private readonly storesService: StoresService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly deliveryService: DeliveryService,
  ) { }

  async checkout(user: User, checkoutOrderDto: CheckoutOrderDto): Promise<Order[]> {
    try {
      if (user.role === Role.ADMIN) {
        throw new ForbiddenException('Admin users cannot place orders');
      }

      const hasPendingCharges = await this.pendingChargeModel.findOne({
        user: user._id,
        status: 'pending'
      }).exec();

      if (hasPendingCharges) {
        throw new BadRequestException('You have pending charges. Please settle them before placing new orders.');
      }

      const geolocation = user.geolocation;
      const hasValidAddress = Boolean(geolocation?.address?.trim().length);
      if (!hasValidAddress) {
        throw new BadRequestException('You must have a valid address to make an order.');
      }

      if (!user.deliveryZone) {
        throw new BadRequestException(
          'You must select your delivery zone before placing an order.',
        );
      }

      const deliveryZone = await this.deliveryService.findZoneById(
        user.deliveryZone.toString(),
      );
      if (!deliveryZone.isActive) {
        throw new BadRequestException('Your delivery zone is no longer available.');
      }

      const platformTiers = await this.deliveryService.getPlatformWeightTiers();

      const productIds = checkoutOrderDto.items.map(item => item.productId);
      const products = await this.productsService.findProductsByIds(productIds);

      if (products.length !== productIds.length) {
        throw new NotFoundException('Some products not found');
      }

      const hasScheduledFor = Boolean(checkoutOrderDto.scheduledFor);
      let scheduledFor: Date | undefined;

      if (hasScheduledFor) {
        scheduledFor = new Date(checkoutOrderDto.scheduledFor!);
        if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now()) {
          throw new BadRequestException('scheduledFor must be a valid future date and time');
        }
      }

      // Reservation is explicit via scheduledFor — isReservable alone does not require it.
      // Purchase (no scheduledFor) works for in-stock products even if they are also reservable.
      if (hasScheduledFor) {
        const nonReservable = products.filter((p) => !p.isReservable);
        if (nonReservable.length) {
          throw new BadRequestException(
            'All products in a reservation order must be reservable',
          );
        }
      }

      const isReservationOrder = hasScheduledFor;

      const storeGroups = new Map<string, StoreGroup>();
      const outOfStockItems: OutOfStockItem[] = [];

      for (const item of checkoutOrderDto.items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (!isReservationOrder && product.stock < item.quantity) {
          outOfStockItems.push({
            productId: product._id.toString(),
            productName: product.name,
            availableStock: product.stock,
            requestedQuantity: item.quantity,
          });
          continue;
        }

        if (!product.isAvailable || !product.isActive) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }

        const store = product.store as any;

        if (store.status !== StoreStatus.ACTIVE) {
          throw new BadRequestException(`Store ${store.name} is not active`);
        }

        if (user.role === Role.PROVIDER || user.role === Role.MESSENGER) {
          const providerOrMessenger = user as any;
          if (providerOrMessenger.stores?.some((s: Types.ObjectId) =>
            s.toString() === store._id.toString())) {
            throw new ForbiddenException(`You cannot place orders to your own store`);
          }
        }

        const storeId = store._id.toString();
        if (!storeGroups.has(storeId)) {
          storeGroups.set(storeId, {
            storeId: store._id,
            items: []
          });
        }

        const resolved = this.productsService.resolveCheckoutSelectedOptions(
          product,
          item.selectedOptions,
        );
        const resolvedAddons = this.productsService.resolveCheckoutSelectedAddons(
          product,
          item.selectedAddons,
        );

        storeGroups.get(storeId)!.items.push({
          productId: product._id,
          product,
          quantity: item.quantity,
          selectedOptions: resolved.selectedOptions,
          selectedAddons: resolvedAddons.selectedAddons,
          unitPriceCents: MoneyUtils.sumCents(
            resolved.unitPriceCents,
            resolvedAddons.extraCents,
          ),
        });
      }

      if (outOfStockItems.length > 0) {
        throw new BadRequestException(
          {
            message: 'Insufficient stock for some products',
            data: outOfStockItems
          },
          {
            cause: 'INSUFFICIENT_STOCK',
            description: 'Some products do not have enough stock',
          }
        );
      }

      const createdOrders: Order[] = [];

      for (const [storeId, group] of storeGroups.entries()) {
        const orderItems = group.items.map(
          ({ product, quantity, selectedOptions, selectedAddons, unitPriceCents }) => ({
            product: product._id,
            quantity,
            pricePerUnit: unitPriceCents,
            totalPrice: MoneyUtils.multiplyCents(unitPriceCents, quantity),
            productName: product.name,
            productSku: product.sku,
            selectedOptions,
            selectedAddons,
          }),
        );

        const subtotal = orderItems.reduce((sum, item) => MoneyUtils.sumCents(sum, item.totalPrice), 0);

        const store = await this.storesService.findById(storeId);
        const deliveryBreakdown = calculateDeliveryCharge({
          items: group.items.map(({ product, quantity }) => ({
            influenceWeight: product.influenceWeight ?? DEFAULT_PRODUCT_INFLUENCE_WEIGHT,
            quantity,
          })),
          zone: deliveryZone,
          zoneId: deliveryZone._id,
          storeDeliveryConfig: store.deliveryConfig,
          platformTiers,
        });
        const deliveryCharge = deliveryBreakdown.deliveryChargeCents;
        const additionalCharges = this.calculateAdditionalCharges();
        const additionalChargesTotal = additionalCharges.reduce((sum, charge) => MoneyUtils.sumCents(sum, charge.amount), 0);
        const total = MoneyUtils.sumCents(subtotal, deliveryCharge, additionalChargesTotal);

        const order = new this.orderModel({
          customer: user._id,
          store: new Types.ObjectId(storeId),
          items: orderItems,
          subtotal,
          deliveryCharge,
          additionalCharges,
          total,
          status: OrderStatus.REQUESTED,
          statusUpdatedAt: new Date(),
          deliveryAddress: user.geolocation,
          channel: OrderChannel.ONLINE,
          ...(scheduledFor ? { scheduledFor } : {}),
        });

        const savedOrder = await order.save();

        if (!isReservationOrder) {
          for (const { product, quantity } of group.items) {
            await this.productsService.updateStock(product._id.toString(), quantity, 'subtract');
          }
        }

        createdOrders.push(savedOrder);
      }

      return createdOrders;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Checkout error:', error);
      throw new InternalServerErrorException('Error creating orders');
    }
  }

  /**
   * In-store POS sale or phone order registered by PROVIDER/MANAGER.
   * Without delivery: completes immediately (counter sale).
   * With delivery: REQUESTED + delivery charge for messenger fulfillment.
   */
  async createPosSale(user: User, dto: PosSaleDto): Promise<Order> {
    try {
      if (user.role !== Role.PROVIDER && user.role !== Role.MANAGER) {
        throw new ForbiddenException('Only store staff can register in-store sales');
      }

      const includeDelivery = dto.includeDelivery === true;

      const store = await this.storesService.findById(dto.storeId);
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      if (store.status !== StoreStatus.ACTIVE) {
        throw new BadRequestException(`Store ${store.name} is not active`);
      }

      this.assertUserCanSellAtStore(user, store);

      let deliveryZone: any = null;
      if (includeDelivery) {
        if (!dto.deliveryZoneId || !dto.customerName?.trim() || !dto.customerPhone?.trim() || !dto.customerAddress?.trim()) {
          throw new BadRequestException(
            'Delivery orders require zone, customer name, phone and exact address',
          );
        }
        deliveryZone = await this.deliveryService.findZoneById(dto.deliveryZoneId);
        if (!deliveryZone.isActive) {
          throw new BadRequestException('Selected delivery zone is no longer available');
        }
      }

      const productIds = dto.items.map((item) => item.productId);
      const products = await this.productsService.findProductsByIds(productIds);
      if (products.length !== productIds.length) {
        throw new NotFoundException('Some products not found');
      }

      const outOfStockItems: OutOfStockItem[] = [];
      const lineItems: StoreGroup['items'] = [];

      for (const item of dto.items) {
        const product = products.find((p) => p._id.toString() === item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        const productStoreId =
          (product.store as any)?._id?.toString?.() || product.store?.toString?.();
        if (productStoreId !== store._id.toString()) {
          throw new BadRequestException(
            `Product ${product.name} does not belong to this store`,
          );
        }

        if (!product.isAvailable || !product.isActive) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }

        if (product.stock < item.quantity) {
          outOfStockItems.push({
            productId: product._id.toString(),
            productName: product.name,
            availableStock: product.stock,
            requestedQuantity: item.quantity,
          });
          continue;
        }

        const resolved = this.productsService.resolveCheckoutSelectedOptions(
          product,
          item.selectedOptions,
        );
        const resolvedAddons = this.productsService.resolveCheckoutSelectedAddons(
          product,
          item.selectedAddons,
        );

        lineItems.push({
          productId: product._id,
          product,
          quantity: item.quantity,
          selectedOptions: resolved.selectedOptions,
          selectedAddons: resolvedAddons.selectedAddons,
          unitPriceCents: MoneyUtils.sumCents(
            resolved.unitPriceCents,
            resolvedAddons.extraCents,
          ),
        });
      }

      if (outOfStockItems.length > 0) {
        throw new BadRequestException(
          {
            message: 'Insufficient stock for some products',
            data: outOfStockItems,
          },
          {
            cause: 'INSUFFICIENT_STOCK',
            description: 'Some products do not have enough stock',
          },
        );
      }

      const orderItems = lineItems.map(
        ({ product, quantity, selectedOptions, selectedAddons, unitPriceCents }) => ({
          product: product._id,
          quantity,
          pricePerUnit: unitPriceCents,
          totalPrice: MoneyUtils.multiplyCents(unitPriceCents, quantity),
          productName: product.name,
          productSku: product.sku,
          selectedOptions,
          selectedAddons,
        }),
      );

      const subtotal = orderItems.reduce(
        (sum, item) => MoneyUtils.sumCents(sum, item.totalPrice),
        0,
      );

      let deliveryCharge = 0;
      if (includeDelivery && deliveryZone) {
        const platformTiers = await this.deliveryService.getPlatformWeightTiers();
        const breakdown = calculateDeliveryCharge({
          items: lineItems.map(({ product, quantity }) => ({
            influenceWeight: product.influenceWeight ?? DEFAULT_PRODUCT_INFLUENCE_WEIGHT,
            quantity,
          })),
          zone: deliveryZone,
          zoneId: deliveryZone._id,
          storeDeliveryConfig: store.deliveryConfig,
          platformTiers,
        });
        deliveryCharge = breakdown.deliveryChargeCents;
      }

      const total = MoneyUtils.sumCents(subtotal, deliveryCharge);

      const order = new this.orderModel({
        store: store._id,
        items: orderItems,
        subtotal,
        deliveryCharge,
        additionalCharges: [],
        total,
        status: includeDelivery ? OrderStatus.REQUESTED : OrderStatus.COMPLETED,
        statusUpdatedAt: new Date(),
        channel: OrderChannel.IN_STORE,
        soldBy: user._id,
        ...(dto.customerName?.trim()
          ? { walkInCustomerName: dto.customerName.trim() }
          : {}),
        ...(includeDelivery
          ? {
              walkInCustomerPhone: dto.customerPhone!.trim(),
              deliveryZone: deliveryZone._id,
              deliveryAddress: {
                address: dto.customerAddress!.trim(),
                latitude: null,
                longitude: null,
              },
            }
          : {}),
        ...(dto.notes?.trim() ? { notes: dto.notes.trim() } : {}),
      });

      const savedOrder = await order.save();

      for (const { product, quantity } of lineItems) {
        await this.productsService.updateStock(product._id.toString(), quantity, 'subtract');
        await this.productsService.incrementTimesOrdered(product._id.toString());
      }

      return savedOrder;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('POS sale error:', error);
      throw new InternalServerErrorException('Error registering in-store sale');
    }
  }

  /** Quote messaging fee for a POS phone order (explicit zone, no customer account). */
  async quotePosDelivery(user: User, dto: PosDeliveryQuoteDto) {
    if (user.role !== Role.PROVIDER && user.role !== Role.MANAGER) {
      throw new ForbiddenException('Only store staff can quote POS delivery');
    }

    const store = await this.storesService.findById(dto.storeId);
    this.assertUserCanSellAtStore(user, store);

    const deliveryZone = await this.deliveryService.findZoneById(dto.deliveryZoneId);
    if (!deliveryZone.isActive) {
      throw new BadRequestException('Selected delivery zone is no longer available');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.productsService.findProductsByIds(productIds);
    if (products.length !== productIds.length) {
      throw new NotFoundException('Some products not found');
    }

    for (const product of products) {
      const productStoreId =
        (product.store as any)?._id?.toString?.() || product.store?.toString?.();
      if (productStoreId !== store._id.toString()) {
        throw new BadRequestException(`Product ${product.name} does not belong to this store`);
      }
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const platformTiers = await this.deliveryService.getPlatformWeightTiers();
    const items = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        influenceWeight: product.influenceWeight ?? DEFAULT_PRODUCT_INFLUENCE_WEIGHT,
        quantity: item.quantity,
      };
    });

    const breakdown = calculateDeliveryCharge({
      items,
      zone: deliveryZone,
      zoneId: deliveryZone._id,
      storeDeliveryConfig: store.deliveryConfig,
      platformTiers,
    });

    return {
      zone: {
        id: deliveryZone._id.toString(),
        name: deliveryZone.name,
        municipality: deliveryZone.municipality,
        province: deliveryZone.province,
      },
      storeId: store._id.toString(),
      storeName: store.name,
      deliveryCharge: MoneyUtils.centsToDecimal(breakdown.deliveryChargeCents),
    };
  }

  private assertUserCanSellAtStore(user: User, store: { _id: Types.ObjectId; owner: Types.ObjectId }) {
    const storeId = store._id.toString();
    if (user.role === Role.PROVIDER) {
      const isOwner = store.owner.toString() === user._id.toString();
      const inStores = (user as any).stores?.some(
        (s: Types.ObjectId) => s.toString() === storeId,
      );
      if (!isOwner && !inStores) {
        throw new ForbiddenException('You do not have access to sell at this store');
      }
      return;
    }
    if (user.role === Role.MANAGER) {
      const inStores = (user as any).stores?.some(
        (s: Types.ObjectId) => s.toString() === storeId,
      );
      if (!inStores) {
        throw new ForbiddenException('You do not have access to sell at this store');
      }
      return;
    }
    throw new ForbiddenException('You do not have access to sell at this store');
  }

  async updateOrderStatus(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    user: User,
  ): Promise<Order> {
    const order = await this.orderModel.findById(orderId)
      .populate('store', 'name owner messengers messengerAssignmentType')
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedMessenger', 'firstName lastName email phone')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const context = new OrderStateContext(
      order,
      this.productsService,
      this.pendingChargeModel,
      this.usersService,
      this.messengerInDelivery,
    );

    await context.transitionTo(updateOrderStatusDto.status, user, updateOrderStatusDto);

    await order.populate('customer store assignedMessenger');

    return order;
  }

  async assignMessenger(
    assignMessengerDto: AssignMessengerDto,
    user: User,
  ): Promise<Order> {
    try {
      const orderId = new Types.ObjectId(assignMessengerDto.orderId);
      const order = await this.orderModel.findById(orderId)
        .populate('store', 'owner messengers')
        .exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.READY_FOR_DELIVERY) {
        throw new BadRequestException("A messenger can only be assigned to an order in the ready_for_delivery status");
      }

      const store = order.store as any;

      const isOwner = store.owner.toString() === user._id.toString();

      if (!isOwner && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Only store owner or admin can assign messengers');
      }

      const messenger = await this.usersService.findOne(assignMessengerDto.messengerId);

      const canWorkAsMessenger =
        messenger.role === Role.MESSENGER ||
        (messenger.role === Role.PROVIDER && (messenger as any).isMessenger === true) ||
        (messenger.role === Role.MANAGER && (messenger as any).isMessenger === true);
      if (!canWorkAsMessenger) {
        throw new BadRequestException('User is not a messenger');
      }

      const messengerUser = messenger as any;
      let isAssociated = false;
      if (messengerUser.stores && messengerUser.stores.length > 0) {
        isAssociated = messengerUser.stores.some(
          (storeId: Types.ObjectId) => storeId.toString() === store._id.toString()
        );
      }
      if (!isAssociated && store.messengers?.some(
        (id: Types.ObjectId) => id.toString() === messenger._id.toString()
      )) {
        isAssociated = true;
      }

      if (!isAssociated && messengerUser?.isPlatformMessenger !== true) {
        throw new BadRequestException('User is not associated with this store');
      }

      const updatedOrder = await this.orderModel.findByIdAndUpdate(
        orderId,
        {
          assignedMessenger: new Types.ObjectId(assignMessengerDto.messengerId),
          updatedBy: user._id,
        },
        { new: true }
      )
        .populate('assignedMessenger', 'firstName lastName email phone')
        .exec();
      if (!updatedOrder) throw new BadRequestException('Error updating order');
      return updatedOrder;
    } catch (error) {
      throw error;
    }
  }

  async findOne(orderId: string, user: User): Promise<Order> {
    try {
      const order = await this.orderModel.findById(orderId)
        .populate('customer', 'firstName lastName email phone')
        .populate('store', 'name description address')
        .populate('assignedMessenger', 'firstName lastName email phone')
        .populate('soldBy', 'firstName lastName email')
        .populate('items.product', 'name sku images')
        .exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const canRead = await this.canReadOrder(order, user);
      if (!canRead) {
        throw new ForbiddenException('You do not have permission to view this order');
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  async findAllPaginated(
    query: ListOrdersQueryDto,
    user: User,
  ): Promise<PaginatedListDto<Order>> {
    try {
      const page: number = Number(query.page) || 1;
      const perPage: number = Number(query.perPage) || 25;

      const filter: any = this.buildOrderFilter(query, user);
      const sort: any = { createdAt: -1 };

      const items: Order[] = await this.orderModel
        .find(filter)
        .populate('customer', 'firstName lastName email')
        .populate('store', 'name')
        .populate('assignedMessenger', 'firstName lastName')
        .populate('soldBy', 'firstName lastName email')
        .sort(sort)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();

      const total: number = await this.orderModel.countDocuments(filter).exec();
      const totalPages: number = Math.ceil(total / perPage) || 1;

      return {
        items,
        total,
        page,
        perPage,
        totalPages,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOrdersByStore(
    query: ListOrdersQueryDto,
    user: User,
  ): Promise<PaginatedListDto<Order>> {
    try {
      if (!query.storeId || query.storeId?.length === 0) {
        throw new BadRequestException("storeId is required");
      }
      const store = await this.storesService.findById(query.storeId);

      const hasAccess = await this.hasStoreAccess(store, user);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this store orders');
      }

      const page: number = Number(query.page) || 1;
      const perPage: number = Number(query.perPage) || 25;

      const filter: any = {
        store: new Types.ObjectId(query.storeId),
      };

      if (query.status && query.status.trim().length > 0) {
        const statuses = query.status.split(',').map(s => s.trim());
        filter.status = { $in: statuses };
      }

      if (query.startDate) {
        filter.createdAt = { $gte: new Date(query.startDate) };
      }
      if (query.endDate) {
        filter.createdAt = { ...filter.createdAt, $lte: new Date(query.endDate) };
      }

      if (query.customerId) {
        filter.customer = new Types.ObjectId(query.customerId);
      }

      if (query.messengerId) {
        filter.assignedMessenger = new Types.ObjectId(query.messengerId);
      }

      if (query.channel) {
        filter.channel = query.channel;
      }

      if (query.soldBy) {
        filter.soldBy = new Types.ObjectId(query.soldBy);
      }

      if (query.hasPendingCharges) {
        filter.hasPendingCharges = query.hasPendingCharges === 'true';
      }

      if (query.search) {
        filter.$or = [
          { trackingNumber: { $regex: query.search, $options: 'i' } },
          { notes: { $regex: query.search, $options: 'i' } },
          { walkInCustomerName: { $regex: query.search, $options: 'i' } },
          { 'items.productName': { $regex: query.search, $options: 'i' } },
        ];
      }

      const items: Order[] = await this.orderModel
        .find(filter)
        .populate('customer', 'firstName lastName email phone')
        .populate('assignedMessenger', 'firstName lastName')
        .populate('soldBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();

      const total: number = await this.orderModel.countDocuments(filter).exec();
      const totalPages: number = Math.ceil(total / perPage) || 1;

      return {
        items,
        total,
        page,
        perPage,
        totalPages,
      };
    } catch (error) {
      throw error;
    }
  }

  async quoteDelivery(user: User, dto: DeliveryQuoteDto) {
    if (!user.deliveryZone) {
      throw new BadRequestException(
        'You must select your delivery zone to calculate delivery charges.',
      );
    }

    const deliveryZone = await this.deliveryService.findZoneById(
      user.deliveryZone.toString(),
    );
    if (!deliveryZone.isActive) {
      throw new BadRequestException('Your delivery zone is no longer available.');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.productsService.findProductsByIds(productIds);

    if (products.length !== productIds.length) {
      throw new NotFoundException('Some products not found');
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const platformTiers = await this.deliveryService.getPlatformWeightTiers();

    const storeGroups = new Map<
      string,
      Array<{ influenceWeight: number; quantity: number }>
    >();

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      const storeId =
        (product.store as any)?._id?.toString?.() || product.store?.toString?.();
      if (!storeId || !Types.ObjectId.isValid(storeId)) {
        throw new BadRequestException(`Product ${product.name} has an invalid store`);
      }
      const group = storeGroups.get(storeId) ?? [];
      group.push({
        influenceWeight: product.influenceWeight ?? DEFAULT_PRODUCT_INFLUENCE_WEIGHT,
        quantity: item.quantity,
      });
      storeGroups.set(storeId, group);
    }

    const quotes = [];

    for (const [storeId, items] of storeGroups.entries()) {
      const store = await this.storesService.findById(storeId);
      const breakdown = calculateDeliveryCharge({
        items,
        zone: deliveryZone,
        zoneId: deliveryZone._id,
        storeDeliveryConfig: store.deliveryConfig,
        platformTiers,
      });

      quotes.push({
        storeId,
        storeName: store.name,
        deliveryCharge: MoneyUtils.centsToDecimal(breakdown.deliveryChargeCents),
        zoneName: deliveryZone.name,
      });
    }

    const totalDeliveryCents = quotes.reduce(
      (sum, q) =>
        MoneyUtils.sumCents(sum, MoneyUtils.decimalToCents(q.deliveryCharge)),
      0,
    );

    return {
      zone: {
        id: deliveryZone._id.toString(),
        name: deliveryZone.name,
        municipality: deliveryZone.municipality,
        province: deliveryZone.province,
      },
      stores: quotes,
      totalDeliveryCharge: MoneyUtils.centsToDecimal(totalDeliveryCents),
    };
  }

  private calculateAdditionalCharges(): Array<{ type: string; amount: number; description?: string }> {
    return [];
  }

  private async canReadOrder(order: Order, user: User): Promise<boolean> {
    const customerId =
      (order.customer as any)?._id?.toString?.() || order.customer?.toString?.();
    if (customerId && customerId === user._id.toString()) {
      return true;
    }

    const soldById =
      (order.soldBy as any)?._id?.toString?.() || (order as any).soldBy?.toString?.();
    if (soldById && soldById === user._id.toString()) {
      return true;
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    const store = await this.storesService.findById(
      (order.store as any)._id?.toString?.() || order.store.toString()
    );
    if (store.owner.toString() === user._id.toString()) {
      return true;
    }

    if (
      (user.role === Role.MANAGER || user.role === Role.PROVIDER) &&
      (user as any).stores?.some(
        (s: Types.ObjectId) => s.toString() === store._id.toString(),
      )
    ) {
      return true;
    }

    if (order.assignedMessenger?._id?.toString() === user._id.toString()) {
      return true;
    }

    return false;
  }

  private buildOrderFilter(query: ListOrdersQueryDto, user: User): any {
    const filter: any = {};

    if (user.role === Role.CUSTOMER) {
      filter.customer = user._id;
    } else {
      const orConditions: any[] = [
        { customer: user._id },
        { assignedMessenger: user._id },
      ];

      if (user.role === Role.MESSENGER && (user as any).stores?.length) {
        orConditions.push({
          status: OrderStatus.READY_FOR_DELIVERY,
          store: { $in: (user as any).stores },
        });
      }

      filter.$or = orConditions;
    }

    if (query.status && query.status.trim().length > 0) {
      const statuses = query.status.split(',').map(s => s.trim());
      filter.status = { $in: statuses };
    }

    if (query.storeId) {
      filter.store = new Types.ObjectId(query.storeId);
    }

    if (query.customerId) {
      filter.customer = new Types.ObjectId(query.customerId);
    }

    if (query.messengerId) {
      filter.assignedMessenger = new Types.ObjectId(query.messengerId);
    }

    if (query.channel) {
      filter.channel = query.channel;
    }

    if (query.soldBy) {
      filter.soldBy = new Types.ObjectId(query.soldBy);
    }

    if (query.search) {
      filter.$or = [
        { trackingNumber: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } },
        { walkInCustomerName: { $regex: query.search, $options: 'i' } },
        { cancellationReason: { $regex: query.search, $options: 'i' } },
        { 'items.productName': { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.startDate) {
      filter.createdAt = { $gte: new Date(query.startDate) };
    }

    if (query.endDate) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(query.endDate) };
    }

    if (query.hasPendingCharges) {
      filter.hasPendingCharges = query.hasPendingCharges === 'true';
    }

    return filter;
  }

  private async hasStoreAccess(store: any, user: User): Promise<boolean> {
    if (user.role === Role.ADMIN) {
      return true;
    }

    if (store.owner.toString() === user._id.toString()) {
      return true;
    }

    if (
      user.role === Role.PROVIDER ||
      user.role === Role.MANAGER ||
      user.role === Role.MESSENGER
    ) {
      const linked = (user as any).stores?.some(
        (storeId: Types.ObjectId) => storeId.toString() === store._id.toString(),
      );
      if (linked) return true;
    }

    return false;
  }
}
