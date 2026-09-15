import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';
import {
  AssignMessengerDto,
  CreateStoreDto,
  UpdateStoreDto,
  UpdateStoreStatusDto,
} from './dto/store.dto';
import {
  CreateStoreVarietyOptionDto,
  CreateStoreVarietyTypeDto,
  UpdateStoreVarietyOptionDto,
  UpdateStoreVarietyTypeDto,
} from './dto/variety.dto';
import { StoreStatus } from './types/store.type';
import { StoreVarietyOption, StoreVarietyType } from './schemas/variety.schema';
import { UsersService } from '../users/users.service';
import { Role } from '../users/types/users.type';
import { Provider } from '../users/schemas/provider.schema';
import { Messenger } from '../users/schemas/messenger.schema';
import { Manager } from '../users/schemas/manager.schema';
import { User } from '../users/schemas/user.schema';
import { UpdateUserAllDto } from '../users/dto/update-user.dto';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { OrderStatus } from '../orders/types/orders.type';
import { DeliveryService } from '../delivery/delivery.service';
import { UpdateStoreDeliveryConfigDto } from '../delivery/dto/update-store-delivery-config.dto';
import { DELIVERY_REGION } from '../delivery/types/delivery.constants';
import { DEFAULT_ZONE_PRICE_CENTS } from '../delivery/types/delivery.constants';

const NON_SALES_STATUSES = [
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
  OrderStatus.ABORTED,
  OrderStatus.RETURNED,
] as const;

const OPEN_ORDER_STATUSES = [
  OrderStatus.REQUESTED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY_FOR_DELIVERY,
  OrderStatus.ON_THE_WAY,
] as const;

export type StoreStatsItem = {
  storeId: string;
  name: string;
  address: string;
  status: StoreStatus;
  slogan?: string;
  productCount: number;
  activeProductCount: number;
  lowStockCount: number;
  unitsSold: number;
  orderCount: number;
  openOrderCount: number;
  completedOrderCount: number;
  revenue: number;
  salesSharePercent: number;
  messengerCount: number;
};

export type ProviderStoresStats = {
  stores: StoreStatsItem[];
  summary: {
    storeCount: number;
    activeStoreCount: number;
    totalProducts: number;
    totalOrders: number;
    totalOpenOrders: number;
    totalRevenue: number;
    totalUnitsSold: number;
    topStoreByRevenue: {
      storeId: string;
      name: string;
      revenue: number;
      salesSharePercent: number;
    } | null;
    topStoreByOrders: {
      storeId: string;
      name: string;
      orderCount: number;
    } | null;
  };
};

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly usersService: UsersService,
    private readonly deliveryService: DeliveryService,
  ) {}

  async create(ownerId: string, dto: CreateStoreDto): Promise<Store> {
    const owner = await this.usersService.findOne(ownerId);
    if (owner.role !== Role.PROVIDER) {
      throw new ForbiddenException('Only approved providers can create stores');
    }

    const provider = owner as Provider;
    const salesProvince =
      provider.salesProvince?.trim() || DELIVERY_REGION.province;
    const salesMunicipality =
      provider.salesMunicipality?.trim() || DELIVERY_REGION.municipality;

    const deliveryConfig = await this.deliveryService.buildDefaultStoreDeliveryConfig(
      salesProvince,
      salesMunicipality,
    );

    const store = new this.storeModel({
      ...dto,
      owner: new Types.ObjectId(ownerId),
      status: StoreStatus.ACTIVE,
      messengers: [],
      products: [],
      deliveryConfig,
    });
    const saved = await store.save();

    const stores = [...(provider.stores || []).map((id) => id), saved._id];
    await this.usersService.saveUpdatedUser(ownerId, {
      stores,
    } as UpdateUserAllDto);

    return saved;
  }

  async findMine(ownerId: string): Promise<Store[]> {
    const user = await this.usersService.findOne(ownerId);
    if (user.role === Role.MANAGER) {
      const storeIds = ((user as any).stores || []) as Types.ObjectId[];
      if (!storeIds.length) return [];
      return this.storeModel
        .find({ _id: { $in: storeIds } })
        .sort({ createdAt: -1 })
        .exec();
    }

    return this.storeModel
      .find({ owner: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getMineStats(ownerId: string): Promise<ProviderStoresStats> {
    const stores = await this.findMine(ownerId);
    const storeIds = stores.map((s) => s._id);

    if (storeIds.length === 0) {
      return {
        stores: [],
        summary: {
          storeCount: 0,
          activeStoreCount: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalOpenOrders: 0,
          totalRevenue: 0,
          totalUnitsSold: 0,
          topStoreByRevenue: null,
          topStoreByOrders: null,
        },
      };
    }

    const [productAgg, orderAgg] = await Promise.all([
      this.productModel.aggregate<{
        _id: Types.ObjectId;
        productCount: number;
        activeProductCount: number;
        lowStockCount: number;
        unitsSold: number;
      }>([
        { $match: { store: { $in: storeIds } } },
        {
          $group: {
            _id: '$store',
            productCount: { $sum: 1 },
            activeProductCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$isAvailable', false] },
                      { $ne: ['$isActive', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: [{ $ifNull: ['$stock', 0] }, 5] }, 1, 0],
              },
            },
            unitsSold: { $sum: { $ifNull: ['$timesOrdered', 0] } },
          },
        },
      ]),
      this.orderModel.aggregate<{
        _id: Types.ObjectId;
        orderCount: number;
        openOrderCount: number;
        completedOrderCount: number;
        revenueCents: number;
        unitsFromOrders: number;
      }>([
        {
          $match: {
            store: { $in: storeIds },
            status: { $nin: [...NON_SALES_STATUSES] },
          },
        },
        {
          $group: {
            _id: '$store',
            orderCount: { $sum: 1 },
            openOrderCount: {
              $sum: {
                $cond: [{ $in: ['$status', [...OPEN_ORDER_STATUSES]] }, 1, 0],
              },
            },
            completedOrderCount: {
              $sum: {
                $cond: [{ $eq: ['$status', OrderStatus.COMPLETED] }, 1, 0],
              },
            },
            revenueCents: { $sum: { $ifNull: ['$total', 0] } },
            unitsFromOrders: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ['$items', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', { $ifNull: ['$$this.quantity', 0] }] },
                },
              },
            },
          },
        },
      ]),
    ]);

    const productByStore = new Map(
      productAgg.map((row) => [row._id.toString(), row]),
    );
    const orderByStore = new Map(
      orderAgg.map((row) => [row._id.toString(), row]),
    );

    const totalRevenueCents = orderAgg.reduce(
      (sum, row) => sum + (row.revenueCents || 0),
      0,
    );

    const storeStats: StoreStatsItem[] = stores.map((store) => {
      const id = store._id.toString();
      const products = productByStore.get(id);
      const orders = orderByStore.get(id);
      const revenueCents = orders?.revenueCents || 0;
      const salesSharePercent =
        totalRevenueCents > 0
          ? Math.round((revenueCents / totalRevenueCents) * 1000) / 10
          : 0;

      return {
        storeId: id,
        name: store.name,
        address: store.address,
        status: store.status,
        slogan: store.slogan,
        productCount: products?.productCount || 0,
        activeProductCount: products?.activeProductCount || 0,
        lowStockCount: products?.lowStockCount || 0,
        unitsSold: Math.max(
          products?.unitsSold || 0,
          orders?.unitsFromOrders || 0,
        ),
        orderCount: orders?.orderCount || 0,
        openOrderCount: orders?.openOrderCount || 0,
        completedOrderCount: orders?.completedOrderCount || 0,
        revenue: revenueCents / 100,
        salesSharePercent,
        messengerCount: store.messengers?.length || 0,
      };
    });

    const sortedByRevenue = [...storeStats].sort(
      (a, b) => b.revenue - a.revenue,
    );
    const sortedByOrders = [...storeStats].sort(
      (a, b) => b.orderCount - a.orderCount,
    );
    const topByRevenue = sortedByRevenue[0];
    const topByOrders = sortedByOrders[0];

    return {
      stores: storeStats,
      summary: {
        storeCount: storeStats.length,
        activeStoreCount: storeStats.filter(
          (s) => s.status === StoreStatus.ACTIVE,
        ).length,
        totalProducts: storeStats.reduce((sum, s) => sum + s.productCount, 0),
        totalOrders: storeStats.reduce((sum, s) => sum + s.orderCount, 0),
        totalOpenOrders: storeStats.reduce(
          (sum, s) => sum + s.openOrderCount,
          0,
        ),
        totalRevenue: totalRevenueCents / 100,
        totalUnitsSold: storeStats.reduce((sum, s) => sum + s.unitsSold, 0),
        topStoreByRevenue:
          topByRevenue && topByRevenue.revenue > 0
            ? {
                storeId: topByRevenue.storeId,
                name: topByRevenue.name,
                revenue: topByRevenue.revenue,
                salesSharePercent: topByRevenue.salesSharePercent,
              }
            : null,
        topStoreByOrders:
          topByOrders && topByOrders.orderCount > 0
            ? {
                storeId: topByOrders.storeId,
                name: topByOrders.name,
                orderCount: topByOrders.orderCount,
              }
            : null,
      },
    };
  }

  async findById(storeId: string): Promise<StoreDocument> {
    const store = await this.storeModel.findById(storeId).exec();
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async update(storeId: string, userId: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    Object.assign(store, dto);
    return store.save();
  }

  async updateStatus(
    storeId: string,
    userId: string,
    dto: UpdateStoreStatusDto,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    store.status = dto.status;
    return store.save();
  }

  async assignMessenger(
    storeId: string,
    ownerId: string,
    dto: AssignMessengerDto,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, ownerId);
    const messengerUser = await this.usersService.findOne(dto.messengerId);

    if (!this.canDeliverAsMessenger(messengerUser)) {
      throw new BadRequestException(
        'User must be a messenger, or a provider/manager with messenger duties enabled',
      );
    }

    if (messengerUser.role === Role.PROVIDER) {
      if (messengerUser._id.toString() !== ownerId) {
        throw new ForbiddenException('Only the store owner provider can be assigned as self-messenger');
      }
    }

    if (
      messengerUser.role === Role.MESSENGER ||
      messengerUser.role === Role.MANAGER
    ) {
      this.assertSameProviderTeam(store, messengerUser);
      await this.assertNoCrossProviderStores(store, messengerUser);
    }

    const messengerOid = new Types.ObjectId(dto.messengerId);
    if (store.messengers.some((id) => id.toString() === dto.messengerId)) {
      throw new ConflictException('Messenger already assigned to this store');
    }

    store.messengers.push(messengerOid);
    await store.save();

    if (messengerUser.role === Role.MESSENGER) {
      const messenger = messengerUser as Messenger;
      const stores = [...(messenger.stores || []).map((id) => id), store._id];
      await this.usersService.saveUpdatedUser(dto.messengerId, {
        stores,
      } as UpdateUserAllDto);
    }

    if (messengerUser.role === Role.MANAGER) {
      const manager = messengerUser as Manager;
      const stores = [...(manager.stores || []).map((id) => id), store._id];
      await this.usersService.saveUpdatedUser(dto.messengerId, {
        stores,
      } as UpdateUserAllDto);
    }

    return store;
  }

  async assignSelfAsMessenger(storeId: string, ownerId: string): Promise<Store> {
    const owner = await this.usersService.findOne(ownerId);
    if (owner.role !== Role.PROVIDER) {
      throw new ForbiddenException('Only providers can self-assign as messenger');
    }

    const provider = owner as Provider;
    if (!provider.isMessenger) {
      await this.usersService.saveUpdatedUser(ownerId, {
        isMessenger: true,
      } as UpdateUserAllDto);
    }

    return this.assignMessenger(storeId, ownerId, { messengerId: ownerId });
  }

  async removeMessenger(
    storeId: string,
    ownerId: string,
    messengerId: string,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, ownerId);

    if (!store.messengers.some((id) => id.toString() === messengerId)) {
      throw new NotFoundException('Messenger is not assigned to this store');
    }

    store.messengers = store.messengers.filter((id) => id.toString() !== messengerId);
    await store.save();

    const messengerUser = await this.usersService.findOne(messengerId);
    if (messengerUser.role === Role.MESSENGER) {
      const messenger = messengerUser as Messenger;
      const stores = (messenger.stores || []).filter(
        (id) => id.toString() !== storeId,
      );
      await this.usersService.saveUpdatedUser(messengerId, {
        stores,
      } as UpdateUserAllDto);
    }

    if (messengerUser.role === Role.MANAGER) {
      const manager = messengerUser as Manager;
      const stores = (manager.stores || []).filter(
        (id) => id.toString() !== storeId,
      );
      await this.usersService.saveUpdatedUser(messengerId, {
        stores,
      } as UpdateUserAllDto);
    }

    return store;
  }

  /**
   * Assigned messengers on the store + team messengers available to assign.
   */
  async listStoreMessengerPanel(storeId: string, ownerId: string) {
    const store = await this.getOwnedStore(storeId, ownerId);
    const assignedIds = (store.messengers || []).map((id) => id.toString());
    const assigned = await this.usersService.findManyByIds(assignedIds);

    const teamMembers = await this.usersService.findByEmployer(ownerId, [
      Role.MESSENGER,
      Role.MANAGER,
    ]);
    const assignedSet = new Set(assignedIds);
    const available = teamMembers.filter((m) => {
      if (m.isActive === false) return false;
      if (assignedSet.has(m._id.toString())) return false;
      return this.canDeliverAsMessenger(m);
    });

    return {
      assigned,
      available,
      canSelfAssign: !assignedSet.has(ownerId),
      ownerIsAssigned: assignedSet.has(ownerId),
      messengerAssignmentType: store.messengerAssignmentType,
    };
  }

  async addProduct(storeId: string, productId: Types.ObjectId): Promise<void> {
    const store = await this.findById(storeId);
    if (store.products.some((id) => id.toString() === productId.toString())) {
      throw new ConflictException('Product already exists in store');
    }
    store.products.push(productId);
    await store.save();
  }

  async removeProduct(storeId: string, productId: Types.ObjectId): Promise<void> {
    const store = await this.findById(storeId);
    store.products = store.products.filter(
      (id) => id.toString() !== productId.toString(),
    );
    await store.save();
  }

  async assertActiveOwnedStore(storeId: string, userId: string): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    if (store.status !== StoreStatus.ACTIVE) {
      throw new BadRequestException('Store is not active');
    }
    return store;
  }

  async listVarietyTypes(storeId: string) {
    const store = await this.findById(storeId);
    const json = store.toJSON() as { varietyTypes?: StoreVarietyType[] };
    return json.varietyTypes || [];
  }

  async createVarietyType(
    storeId: string,
    userId: string,
    dto: CreateStoreVarietyTypeDto,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    const nameExists = (store.varietyTypes || []).some(
      (t) => t.name.trim().toLowerCase() === dto.name.trim().toLowerCase(),
    );
    if (nameExists) {
      throw new ConflictException(`Variety type "${dto.name}" already exists`);
    }

    store.varietyTypes.push({
      _id: new Types.ObjectId(),
      name: dto.name.trim(),
      isActive: dto.isActive ?? true,
      isRequired: dto.isRequired ?? true,
      sortOrder: dto.sortOrder ?? store.varietyTypes.length,
      options: [],
    } as StoreVarietyType);

    return store.save();
  }

  async updateVarietyType(
    storeId: string,
    userId: string,
    typeId: string,
    dto: UpdateStoreVarietyTypeDto,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    const type = this.findVarietyTypeOrThrow(store, typeId);

    if (dto.name !== undefined) {
      const nameExists = (store.varietyTypes || []).some(
        (t) =>
          t._id.toString() !== typeId &&
          t.name.trim().toLowerCase() === dto.name!.trim().toLowerCase(),
      );
      if (nameExists) {
        throw new ConflictException(`Variety type "${dto.name}" already exists`);
      }
      type.name = dto.name.trim();
    }
    if (dto.isActive !== undefined) type.isActive = dto.isActive;
    if (dto.isRequired !== undefined) type.isRequired = dto.isRequired;
    if (dto.sortOrder !== undefined) type.sortOrder = dto.sortOrder;

    store.markModified('varietyTypes');
    return store.save();
  }

  async removeVarietyType(
    storeId: string,
    userId: string,
    typeId: string,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    this.findVarietyTypeOrThrow(store, typeId);
    store.varietyTypes = store.varietyTypes.filter((t) => t._id.toString() !== typeId);
    store.markModified('varietyTypes');
    return store.save();
  }

  async createVarietyOption(
    storeId: string,
    userId: string,
    typeId: string,
    dto: CreateStoreVarietyOptionDto,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    const type = this.findVarietyTypeOrThrow(store, typeId);
    const data = CreateStoreVarietyOptionDto.toCents(dto);

    const labelExists = type.options.some(
      (o) => o.label.trim().toLowerCase() === data.label.trim().toLowerCase(),
    );
    if (labelExists) {
      throw new ConflictException(`Option "${data.label}" already exists in this variety type`);
    }

    const wantDefault = data.isDefault === true;
    if (wantDefault) {
      for (const o of type.options) {
        o.isDefault = false;
      }
    }
    // First option becomes default unless explicitly set to false.
    const isDefault = wantDefault || (type.options.length === 0 && data.isDefault !== false);

    type.options.push({
      _id: new Types.ObjectId(),
      label: data.label.trim(),
      priceDelta: data.priceDelta ?? 0,
      isActive: data.isActive ?? true,
      isDefault,
      sortOrder: data.sortOrder ?? type.options.length,
    } as StoreVarietyOption);

    store.markModified('varietyTypes');
    return store.save();
  }

  async updateVarietyOption(
    storeId: string,
    userId: string,
    typeId: string,
    optionId: string,
    dto: UpdateStoreVarietyOptionDto,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    const type = this.findVarietyTypeOrThrow(store, typeId);
    const option = this.findVarietyOptionOrThrow(type, optionId);
    const data = UpdateStoreVarietyOptionDto.toCents(dto);

    if (data.label !== undefined) {
      const labelExists = type.options.some(
        (o) =>
          o._id.toString() !== optionId &&
          o.label.trim().toLowerCase() === data.label!.trim().toLowerCase(),
      );
      if (labelExists) {
        throw new ConflictException(`Option "${data.label}" already exists in this variety type`);
      }
      option.label = data.label.trim();
    }
    if (data.priceDelta !== undefined) option.priceDelta = data.priceDelta;
    if (data.isActive !== undefined) option.isActive = data.isActive;
    if (data.sortOrder !== undefined) option.sortOrder = data.sortOrder;
    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        for (const o of type.options) {
          o.isDefault = o._id.toString() === optionId;
        }
      } else {
        option.isDefault = false;
      }
    }

    store.markModified('varietyTypes');
    return store.save();
  }

  async removeVarietyOption(
    storeId: string,
    userId: string,
    typeId: string,
    optionId: string,
  ): Promise<Store> {
    const store = await this.getOwnedStore(storeId, userId);
    const type = this.findVarietyTypeOrThrow(store, typeId);
    this.findVarietyOptionOrThrow(type, optionId);
    type.options = type.options.filter((o) => o._id.toString() !== optionId);
    store.markModified('varietyTypes');
    return store.save();
  }

  private findVarietyTypeOrThrow(store: StoreDocument, typeId: string): StoreVarietyType {
    const type = (store.varietyTypes || []).find((t) => t._id.toString() === typeId);
    if (!type) {
      throw new NotFoundException(`Variety type ${typeId} not found`);
    }
    return type;
  }

  private findVarietyOptionOrThrow(
    type: StoreVarietyType,
    optionId: string,
  ): StoreVarietyOption {
    const option = (type.options || []).find((o) => o._id.toString() === optionId);
    if (!option) {
      throw new NotFoundException(`Variety option ${optionId} not found`);
    }
    return option;
  }

  private async getOwnedStore(storeId: string, userId: string): Promise<StoreDocument> {
    const store = await this.findById(storeId);
    if (store.owner.toString() !== userId) {
      throw new ForbiddenException('You are not the owner of this store');
    }
    return store;
  }

  private canDeliverAsMessenger(user: User): boolean {
    if (user.role === Role.MESSENGER) return true;
    if (user.role === Role.PROVIDER && (user as Provider).isMessenger === true) {
      return true;
    }
    if (user.role === Role.MANAGER && (user as Manager).isMessenger === true) {
      return true;
    }
    return false;
  }

  private assertSameProviderTeam(store: StoreDocument, user: User) {
    const employer = (user as Messenger | Manager).employer?.toString?.();
    if (employer && employer !== store.owner.toString()) {
      throw new ForbiddenException('User is not part of your team');
    }
  }

  private async assertNoCrossProviderStores(store: StoreDocument, user: User) {
    const ownerObjectId = store.owner.toString();
    const linkedStores =
      user.role === Role.MESSENGER
        ? (user as Messenger).stores || []
        : (user as Manager).stores || [];

    for (const existingStoreId of linkedStores) {
      const existingStore = await this.storeModel.findById(existingStoreId).exec();
      if (existingStore && existingStore.owner.toString() !== ownerObjectId) {
        throw new BadRequestException(
          'User is already assigned to stores of a different provider',
        );
      }
    }
  }

  async getStoreDeliveryConfig(storeId: string, userId: string) {
    const store = await this.findById(storeId);
    await this.assertCanManageDeliveryConfig(store, userId);

    const owner = (await this.usersService.findOne(store.owner.toString())) as Provider;
    const salesProvince =
      owner.salesProvince?.trim() || DELIVERY_REGION.province;
    const salesMunicipality =
      owner.salesMunicipality?.trim() || DELIVERY_REGION.municipality;

    const zones = await this.deliveryService.listZones({
      province: salesProvince,
      municipality: salesMunicipality,
    });
    const platformTiers = await this.deliveryService.getPlatformWeightTiers();

    return {
      ...this.deliveryService.formatStoreDeliveryConfig(
        store.deliveryConfig,
        zones,
        platformTiers,
      ),
      salesProvince,
      salesMunicipality,
    };
  }

  /**
   * Recorta/amplía zonePrices de las tiendas del provider al cambiar su
   * provincia/municipio de venta.
   */
  async syncProviderStoresDeliveryArea(
    providerId: string,
    province: string,
    municipality: string,
  ): Promise<void> {
    const zones = await this.deliveryService.listZones({ province, municipality });
    const zoneIds = new Set(zones.map((z) => z._id.toString()));
    const stores = await this.storeModel
      .find({ owner: new Types.ObjectId(providerId) })
      .exec();

    for (const store of stores) {
      const existing = store.deliveryConfig?.zonePrices ?? [];
      const kept = existing.filter((zp) => zoneIds.has(zp.zoneId.toString()));
      const keptIds = new Set(kept.map((zp) => zp.zoneId.toString()));
      const added = zones
        .filter((z) => !keptIds.has(z._id.toString()))
        .map((z) => ({
          zoneId: z._id,
          priceCents: z.defaultPriceCents ?? DEFAULT_ZONE_PRICE_CENTS,
        }));

      store.deliveryConfig = {
        zonePrices: [...kept, ...added],
        weightSurchargeTiers: store.deliveryConfig?.weightSurchargeTiers ?? [],
      };
      store.markModified('deliveryConfig');
      await store.save();
    }
  }

  async findStoreIdsDeliveringToZone(zoneId: string): Promise<Types.ObjectId[]> {
    const zone = await this.deliveryService.findZoneById(zoneId);
    const stores = await this.storeModel
      .find({ status: StoreStatus.ACTIVE })
      .select('_id owner deliveryConfig')
      .populate({
        path: 'owner',
        select: 'salesProvince salesMunicipality role',
      })
      .exec();

    const zoneProvince = zone.province.trim().toLowerCase();
    const zoneMunicipality = zone.municipality.trim().toLowerCase();

    const ids = stores
      .filter((store) => {
        const owner = store.owner as unknown as Provider | null;
        if (!owner || owner.role !== Role.PROVIDER) return false;

        const salesProvince = (
          owner.salesProvince?.trim() || DELIVERY_REGION.province
        ).toLowerCase();
        const salesMunicipality = (
          owner.salesMunicipality?.trim() || DELIVERY_REGION.municipality
        ).toLowerCase();

        if (
          salesProvince !== zoneProvince ||
          salesMunicipality !== zoneMunicipality
        ) {
          return false;
        }

        const prices = store.deliveryConfig?.zonePrices ?? [];
        if (!prices.length) return false;
        return prices.some((zp) => zp.zoneId.toString() === zoneId);
      })
      .map((store) => store._id);

    return ids;
  }

  async updateStoreDeliveryConfig(
    storeId: string,
    userId: string,
    dto: UpdateStoreDeliveryConfigDto,
  ): Promise<Store> {
    const store = await this.findById(storeId);
    await this.assertCanManageDeliveryConfig(store, userId);

    const payload = UpdateStoreDeliveryConfigDto.toCents(dto);
    const nextConfig = {
      zonePrices: (payload.zonePrices ?? store.deliveryConfig?.zonePrices ?? []).map(
        (zp) => ({
          zoneId: new Types.ObjectId(zp.zoneId.toString()),
          priceCents: zp.priceCents,
        }),
      ),
      weightSurchargeTiers:
        payload.weightSurchargeTiers ?? store.deliveryConfig?.weightSurchargeTiers ?? [],
    };

    if (nextConfig.zonePrices.length) {
      const owner = (await this.usersService.findOne(store.owner.toString())) as Provider;
      const salesProvince =
        owner.salesProvince?.trim() || DELIVERY_REGION.province;
      const salesMunicipality =
        owner.salesMunicipality?.trim() || DELIVERY_REGION.municipality;
      const allowedZones = await this.deliveryService.listZones({
        province: salesProvince,
        municipality: salesMunicipality,
      });
      const zoneIds = new Set(allowedZones.map((z) => z._id.toString()));
      for (const zp of nextConfig.zonePrices) {
        if (!zoneIds.has(zp.zoneId.toString())) {
          throw new BadRequestException(
            `Delivery zone ${zp.zoneId} is outside your sales area (${salesMunicipality})`,
          );
        }
      }
    }

    store.deliveryConfig = nextConfig;
    store.markModified('deliveryConfig');
    return store.save();
  }

  private async assertCanManageDeliveryConfig(
    store: StoreDocument,
    userId: string,
  ): Promise<void> {
    if (store.owner.toString() === userId) {
      return;
    }

    const user = await this.usersService.findOne(userId);
    const storeIdStr = store._id.toString();
    const linkedStoreIds =
      user.role === Role.MESSENGER
        ? (user as Messenger).stores || []
        : user.role === Role.MANAGER
          ? (user as Manager).stores || []
          : user.role === Role.PROVIDER
            ? (user as Provider).stores || []
            : [];
    const isAssignedMessenger =
      store.messengers.some((id) => id.toString() === userId) ||
      linkedStoreIds.some((id) => id.toString() === storeIdStr);

    if (
      isAssignedMessenger &&
      this.canDeliverAsMessenger(user) &&
      (user.role === Role.MESSENGER || user.role === Role.PROVIDER || user.role === Role.MANAGER)
    ) {
      this.assertSameProviderTeam(store, user);
      return;
    }

    throw new ForbiddenException(
      'Only the store owner or assigned messengers can manage delivery configuration',
    );
  }
}
