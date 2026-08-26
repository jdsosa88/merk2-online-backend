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
import { StoreStatus } from './types/store.type';
import { UsersService } from '../users/users.service';
import { Role } from '../users/types/users.type';
import { Provider } from '../users/schemas/provider.schema';
import { Messenger } from '../users/schemas/messenger.schema';
import { Manager } from '../users/schemas/manager.schema';
import { User } from '../users/schemas/user.schema';
import { UpdateUserAllDto } from '../users/dto/update-user.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(ownerId: string, dto: CreateStoreDto): Promise<Store> {
    const owner = await this.usersService.findOne(ownerId);
    if (owner.role !== Role.PROVIDER) {
      throw new ForbiddenException('Only approved providers can create stores');
    }

    const store = new this.storeModel({
      ...dto,
      owner: new Types.ObjectId(ownerId),
      status: StoreStatus.ACTIVE,
      messengers: [],
      products: [],
    });
    const saved = await store.save();

    const provider = owner as Provider;
    const stores = [...(provider.stores || []).map((id) => id), saved._id];
    await this.usersService.saveUpdatedUser(ownerId, {
      stores,
    } as UpdateUserAllDto);

    return saved;
  }

  async findMine(ownerId: string): Promise<Store[]> {
    return this.storeModel
      .find({ owner: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .exec();
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
}
