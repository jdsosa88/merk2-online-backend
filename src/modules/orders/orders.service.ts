import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Provider
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { PendingCharge, PendingChargeDocument } from './schemas/pending-charge.schema';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignMessengerDto } from './dto/assign-messenger.dto';
import { User } from '../users/schemas/user.schema';
import { BusinessService } from '../business/business.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { Role, UserRole } from '../users/types/users.type';
import { BusinessStatus, MessengerAssigmentType } from '../business/types/business.type';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from './types/orders.type';
import { MoneyUtils } from 'src/common/utils/money.utils';
import { MessengerInDelivery, MessengerInDeliveryDocument } from './schemas/messengers-in-delivery.schema';
import { OrderStateContext } from './state/order-state.context';

interface OutOfStockItem {
  productId: string;
  productName?: string;
  availableStock: number;
  requestedQuantity: number;
}

interface BusinessGroup {
  businessId: Types.ObjectId;
  items: Array<{
    productId: Types.ObjectId;
    product: any;
    quantity: number;
  }>;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(PendingCharge.name) private pendingChargeModel: Model<PendingChargeDocument>,
    @InjectModel(MessengerInDelivery.name) private messengerInDelivery: Model<MessengerInDeliveryDocument>,
    private readonly businessService: BusinessService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) { }

  async checkout(user: User, checkoutOrderDto: CheckoutOrderDto): Promise<Order[]> {
    try {
      // 1. Validate user can place orders
      if (user.role === Role.ADMIN) {
        throw new ForbiddenException('Admin users cannot place orders');
      }

      // 2. Check if user has pending charges
      const hasPendingCharges = await this.pendingChargeModel.findOne({
        user: user._id,
        status: 'pending'
      }).exec();

      if (hasPendingCharges) {
        throw new BadRequestException('You have pending charges. Please settle them before placing new orders.');
      }

      const geolocation = user.geolocation;
      const hasValidAddress = geolocation &&
        geolocation.address.length > 0 &&
        geolocation.latitude !== null &&
        geolocation.longitude !== null
        ? true : false;
      if (!hasValidAddress) {
        throw new BadRequestException('You must have a valid address to make an order.');
      }
      // 3. Validate all products exist and have enough stock
      const productIds = checkoutOrderDto.items.map(item => item.productId);
      const products = await this.productsService.findProductsByIds(productIds);

      if (products.length !== productIds.length) {
        throw new NotFoundException('Some products not found');
      }

      // 4. Group products by business and validate
      const businessGroups = new Map<string, BusinessGroup>();
      const outOfStockItems: OutOfStockItem[] = [];

      for (const item of checkoutOrderDto.items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        // Check stock
        if (product.stock < item.quantity) {
          outOfStockItems.push({
            productId: product._id.toString(),
            productName: product.name,
            availableStock: product.stock,
            requestedQuantity: item.quantity,
          });
          continue;
        }

        // Check if product is available
        if (!product.isAvailable || !product.isActive) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }

        // Get business and validate
        const business = product.business as any;

        // Check business status
        if (business.status !== BusinessStatus.ACCEPTED) {
          throw new BadRequestException(`Business ${business.name} is not active`);
        }

        // Check if user is linked to this business (for PROVIDER, MANAGER, MESSENGER)
        if (user.role === Role.PROVIDER || user.role === Role.MESSENGER) {
          const providerOrMessenger = user as any;
          if (providerOrMessenger.businesses?.some((b: Types.ObjectId) =>
            b.toString() === business._id.toString())) {
            throw new ForbiddenException(`You cannot place orders to your own business`);
          }
        }

        if (user.role === Role.MANAGER) {
          const manager = user as any;
          if (manager.business?.toString() === business._id.toString()) {
            throw new ForbiddenException(`You cannot place orders to your own business`);
          }
        }

        // Group by business
        const businessId = business._id.toString();
        if (!businessGroups.has(businessId)) {
          businessGroups.set(businessId, {
            businessId: business._id,
            items: []
          });
        }

        businessGroups.get(businessId)!.items.push({
          productId: product._id,
          product,
          quantity: item.quantity

        });
      }

      // 5. If any products are out of stock, throw error with details
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

      // 6. Create orders for each business group
      const createdOrders: Order[] = [];

      for (const [businessId, group] of businessGroups.entries()) {
        // Calculate order details
        const orderItems = group.items.map(({ product, quantity }) => ({
          product: product._id,
          quantity,
          pricePerUnit: product.finalPrice,
          totalPrice: MoneyUtils.multiplyCents(product.finalPrice, quantity),
          productName: product.name,
          productSku: product.sku,
        }));

        const subtotal = orderItems.reduce((sum, item) => MoneyUtils.sumCents(sum, item.totalPrice), 0);

        // Calculate delivery charge (simplified - could be based on distance, business settings, etc.)
        const deliveryCharge = this.calculateDeliveryCharge();

        // Calculate additional charges (taxes, fees)
        const additionalCharges = this.calculateAdditionalCharges();
        const additionalChargesTotal = additionalCharges.reduce((sum, charge) => MoneyUtils.sumCents(sum, charge.amount), 0);

        const total = MoneyUtils.sumCents(subtotal, deliveryCharge, additionalChargesTotal);

        // Create order
        const order = new this.orderModel({
          customer: user._id,
          business: new Types.ObjectId(businessId),
          items: orderItems,
          subtotal,
          deliveryCharge,
          additionalCharges,
          total,
          status: OrderStatus.REQUESTED,
          statusUpdatedAt: new Date(),
          deliveryAddress: user.geolocation,
        });

        const savedOrder = await order.save();

        // Update product stock
        for (const { product, quantity } of group.items) {
          await this.productsService.updateStock(product._id.toString(), quantity, 'subtract');
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

  async updateOrderStatus(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    user: User,
  ): Promise<Order> {
    const order = await this.orderModel.findById(orderId)
      .populate('business', 'name owner employees messengerAssigmentType')
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
      this.businessService,
      this.usersService,
      this.messengerInDelivery,
    );

    await context.transitionTo(updateOrderStatusDto.status, user, updateOrderStatusDto);

    // Refrescar poblaciones si es necesario (algunos campos como assignedMessenger pueden haber cambiado)
    await order.populate('customer business assignedMessenger');

    return order;
  }

  async assignMessenger(
    assignMessengerDto: AssignMessengerDto,
    user: User,
  ): Promise<Order> {
    try {
      const orderId = new Types.ObjectId(assignMessengerDto.orderId);
      const order = await this.orderModel.findById(orderId)
        .populate('business', 'owner employees')
        .exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      //Validate order status is ready_for_delivery
      if (order.status !== OrderStatus.READY_FOR_DELIVERY) {
        throw new BadRequestException("A messenger can only be assigned to an order in the ready_for_delivery status");
      }

      // Validate user can assign messengers (business owner/manager)
      const business = order.business as any;

      const isOwner = business.owner.toString() === user._id.toString();
      const isManager = business.employees?.managers?.some(
        (managerId: Types.ObjectId) => managerId.toString() === user._id.toString()
      );

      if (!isOwner && !isManager && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Only business owner, manager, or admin can assign messengers');
      }

      // Validate messenger exists and is a MESSENGER
      const messenger = await this.usersService.findOne(assignMessengerDto.messengerId);
      console.log(messenger);

      const canWorkAsMessenger = (user.role === Role.PROVIDER || user.role === Role.MANAGER) &&
        (user as any).isMessenger === true;
      if (messenger.role !== Role.MESSENGER && !canWorkAsMessenger) {
        throw new BadRequestException('User is not a messenger');
      }

      // Validate messenger is available for this business
      const messengerUser = messenger as any;
      let isAssociated = false;
      if (messengerUser.businesses && messengerUser.businesses.length > 0) {
        isAssociated = messengerUser.businesses.some(
          (businessId: Types.ObjectId) => businessId.toString() === business._id.toString()
        );
      } else {
        isAssociated = messengerUser.busines &&
          messengerUser.business.toString() === order.business.toString();
      }

      if (!isAssociated && !messengerUser?.isPlatformMessenger === true) {
        throw new BadRequestException('User is not associated with this business');
      }

      // Update order
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
        .populate('business', 'name description phones')
        .populate('assignedMessenger', 'firstName lastName email phone')
        .populate('items.product', 'name sku images')
        .exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Check permissions
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

      // Build sort
      const sort: any = { createdAt: -1 };

      const items: Order[] = await this.orderModel
        .find(filter)
        .populate('customer', 'firstName lastName email')
        .populate('business', 'name')
        .populate('assignedMessenger', 'firstName lastName')
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

  async findOrdersByBusiness(
    query: ListOrdersQueryDto,
    user: User,
  ): Promise<PaginatedListDto<Order>> {
    try {
      // Validate user has access to this business
      if (!query.businessId || query.businessId?.length === 0) {
        throw new BadRequestException("businessId is required");
      }
      const business = await this.businessService.findById(query.businessId);

      const hasAccess = await this.hasBusinessAccess(business, user);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this business orders');
      }

      const page: number = Number(query.page) || 1;
      const perPage: number = Number(query.perPage) || 25;

      const filter: any = {
        business: new Types.ObjectId(query.businessId),
      };

      // Add status filter if provided
      if (query.status && query.status.trim().length > 0) {
        const statuses = query.status.split(',').map(s => s.trim());
        filter.status = { $in: statuses };
      }

      // Add date range filter
      if (query.startDate) {
        filter.createdAt = { $gte: new Date(query.startDate) };
      }
      if (query.endDate) {
        filter.createdAt = { ...filter.createdAt, $lte: new Date(query.endDate) };
      }

      //Add customer filter
      if (query.customerId) {
        filter.customer = new Types.ObjectId(query.customerId);
      }

      //Add assigned messenger filter
      if (query.messengerId) {
        filter.assignedMessenger = new Types.ObjectId(query.messengerId);
      }

      //Add pending charges filter
      if (query.hasPendingCharges) {
        filter.hasPendingCharges = query.hasPendingCharges === 'true';
      }

      // Add search filter
      if (query.search) {
        filter.$or = [
          { trackingNumber: { $regex: query.search, $options: 'i' } },
          { notes: { $regex: query.search, $options: 'i' } },
          { 'items.productName': { $regex: query.search, $options: 'i' } },
        ];
      }

      const items: Order[] = await this.orderModel
        .find(filter)
        .populate('customer', 'firstName lastName email phone')
        .populate('assignedMessenger', 'firstName lastName')
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

  private calculateDeliveryCharge(): number {
    return 0; //not calculated yet
  }

  private calculateAdditionalCharges(): Array<{ type: string; amount: number; description?: string }> {
    return []; //not claculated yet
  }

  private async canReadOrder(order: Order, user: User): Promise<boolean> {
    // Customer can read their own orders
    if (order.customer._id.toString() === user._id.toString()) {
      return true;
    }

    // Admin can read all orders
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Business owner/manager can read their business orders
    const business = await this.businessService.findById(order.business._id.toString());
    if (business.owner._id.toString() === user._id.toString()) {
      return true;
    }

    if (business.employees?.managers?.some(
      (managerId: Types.ObjectId) => managerId.toString() === user._id.toString()
    )) {
      return true;
    }

    // Messenger can read assigned orders
    if (order.assignedMessenger?._id?.toString() === user._id.toString()) {
      return true;
    }

    return false;
  }

  private buildOrderFilter(query: ListOrdersQueryDto, user: User): any {
    const filter: any = {};

    filter.$or = [
      { customer: user._id },
      { ...(user.role !== Role.CUSTOMER && { assignedMessenger: user._id }) },
      {
        ...(user.role === Role.MESSENGER && { status: OrderStatus.READY_FOR_DELIVERY, }),
        business: (user as any).businesses ?
          { $in: (user as any).businesses } :
          (user as any).busines ?
            (user as any).busines :
            null
      }
    ];

    // Apply additional filters
    if (query.status && query.status.trim().length > 0) {
      const statuses = query.status.split(',').map(s => s.trim());
      filter.status = { $in: statuses };
    }

    if (query.businessId) {
      filter.business = new Types.ObjectId(query.businessId);
    }

    if (query.customerId) {
      filter.customer = new Types.ObjectId(query.customerId);
    }

    if (query.messengerId) {
      filter.assignedMessenger = new Types.ObjectId(query.messengerId);
    }

    if (query.search) {
      filter.$or = [
        { trackingNumber: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } },
        { cancellationReason: { $regex: query.search, $options: 'i' } },
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

  private async hasBusinessAccess(business: any, user: User): Promise<boolean> {
    if (user.role === Role.ADMIN) {
      return true;
    }

    if (business.owner.toString() === user._id.toString()) {
      return true;
    }

    if (business.employees?.managers?.some(
      (managerId: Types.ObjectId) => managerId.toString() === user._id.toString()
    )) {
      return true;
    }

    if (user.role === Role.MESSENGER) {
      const messenger = user as any;
      if (messenger.businesses?.some(
        (businessId: Types.ObjectId) => businessId.toString() === business._id.toString()
      )) {
        return true;
      }
    }

    return false;
  }
}