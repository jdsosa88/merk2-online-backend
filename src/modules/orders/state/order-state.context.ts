import { OrderDocument } from '../schemas/order.schema';
import { OrderStatus } from '../types/orders.type';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ProductsService } from '../../products/products.service';
import { Model, Types } from 'mongoose';
import { PendingChargeDocument } from '../schemas/pending-charge.schema';
import { UsersService } from '../../users/users.service';
import { MessengerInDeliveryDocument } from '../schemas/messengers-in-delivery.schema';
import { OrderState } from './order-state.abstract';
import { RequestedState } from './requested.state';
import { InPreparationState } from './in-preparation.state';
import { ReadyForDeliveryState } from './ready-for-delivery.state';
import { OnTheWayState } from './on-the-way.state';
import { TerminalState } from './terminal.state';
import { Role } from '../../users/types/users.type';
import { MessengerAssignmentType } from '../../stores/types/store.type';

export class OrderStateContext {
  private state: OrderState;

  constructor(
    public readonly order: OrderDocument,
    private readonly productsService: ProductsService,
    private readonly pendingChargeModel: Model<PendingChargeDocument>,
    private readonly usersService: UsersService,
    private readonly messengerInDeliveryModel: Model<MessengerInDeliveryDocument>,
  ) {
    this.setStateFromStatus();
  }

  private setStateFromStatus() {
    switch (this.order.status) {
      case OrderStatus.REQUESTED:
        this.state = new RequestedState(this);
        break;
      case OrderStatus.IN_PREPARATION:
        this.state = new InPreparationState(this);
        break;
      case OrderStatus.READY_FOR_DELIVERY:
        this.state = new ReadyForDeliveryState(this);
        break;
      case OrderStatus.ON_THE_WAY:
        this.state = new OnTheWayState(this);
        break;
      default:
        this.state = new TerminalState(this);
        break;
    }
  }

  async transitionTo(targetStatus: OrderStatus, user: User, dto: UpdateOrderStatusDto): Promise<void> {
    await this.state.transitionTo(targetStatus, user, dto);
  }

  async updateOrder(updateData: Partial<any>): Promise<void> {
    Object.assign(this.order, updateData);
    await this.order.save();
  }

  async autoAssignMessenger(): Promise<void> {
    const store = this.order.store as any;
    if (store.messengerAssignmentType !== MessengerAssignmentType.AUTOMATIC) return;

    const possibleAssignees = [
      ...(store.messengers || []),
      store.owner,
    ];

    for (const assigneeId of possibleAssignees) {
      try {
        const user = await this.usersService.findOne(assigneeId.toString());
        const canWorkAsMessenger =
          user.role === Role.MESSENGER ||
          (user.role === Role.PROVIDER && (user as any).isMessenger === true) ||
          (user.role === Role.MANAGER && (user as any).isMessenger === true);
        if (!canWorkAsMessenger) continue;

        const messengerUser = user as any;
        let isAssociated = false;
        if (messengerUser.stores?.length > 0) {
          isAssociated = messengerUser.stores.some((sId: Types.ObjectId) => sId.toString() === store._id.toString());
        }
        if (!isAssociated && store.messengers?.some(
          (id: Types.ObjectId) => id.toString() === user._id.toString()
        )) {
          isAssociated = true;
        }
        if (!isAssociated && !messengerUser?.isPlatformMessenger) continue;

        this.order.assignedMessenger = assigneeId;
        await this.order.save();
        return;
      } catch (error) {
        // continue with next messenger
      }
    }
  }

  async createPendingDeliveryCharge(reason: string): Promise<void> {
    if (!this.order.customer) {
      return;
    }
    const pendingCharge = new this.pendingChargeModel({
      user: this.order.customer,
      order: this.order._id,
      type: 'delivery_return',
      amount: this.order.deliveryCharge,
      description: `Delivery charge for returned order: ${reason}`,
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await pendingCharge.save();
    this.order.hasPendingCharges = true;
    await this.order.save();
  }

  async returnOrderStock(): Promise<void> {
    for (const item of this.order.items) {
      try {
        await this.productsService.updateStock(
          item.product.toString(),
          item.quantity,
          'add'
        );
      } catch (error) {
        console.error(`Failed to return stock for product ${item.product}:`, error);
      }
    }
  }

  async incrementOrderProductsTimesOrdered() {
    for (const item of this.order.items) {
      await this.productsService.incrementTimesOrdered(item.product.toString());
    }
  }

  isCustomer(user: User): boolean {
    const customerId = this.order.customer?._id?.toString?.()
      ?? this.order.customer?.toString?.();
    return Boolean(customerId && customerId === user._id.toString());
  }

  isStoreOwner(user: User): boolean {
    const store = this.order.store as any;
    return store.owner.toString() === user._id.toString();
  }

  /** @deprecated Prefer isStoreOwner */
  isBusinessOwnerOrManager(user: User): boolean {
    return this.isStoreOwner(user);
  }

  isAssignedMessenger(user: User): boolean {
    const assignedMessenger =
      this.order.assignedMessenger?._id?.toString?.() ||
      this.order.assignedMessenger?.toString?.();
    return Boolean(assignedMessenger && assignedMessenger === user._id.toString());
  }

  canAbort(user: User): boolean {
    if (this.order.status === OrderStatus.ON_THE_WAY) {
      return this.canManageDelivery(user);
    }
    return this.isStoreOwner(user);
  }

  canCancelAsCustomer(user: User): boolean {
    return this.isCustomer(user);
  }

  /** Kitchen / pre-delivery management (owner). */
  canManageStoreOrder(user: User): boolean {
    if (
      this.order.status === OrderStatus.READY_FOR_DELIVERY ||
      this.order.status === OrderStatus.ON_THE_WAY
    ) {
      return this.canManageDelivery(user);
    }
    return this.isStoreOwner(user);
  }

  /**
   * Delivery leg: store owner (may self-deliver) OR assigned messenger
   * OR eligible store/platform messenger who can claim the order.
   */
  canManageDelivery(user: User): boolean {
    if (this.isStoreOwner(user)) return true;
    if (this.isAssignedMessenger(user)) return true;
    return this.isEligibleStoreMessenger(user);
  }

  isEligibleStoreMessenger(user: User): boolean {
    const store = this.order.store as any;
    if (!store) return false;

    const canWorkAsMessenger =
      user.role === Role.MESSENGER ||
      (user.role === Role.PROVIDER && (user as any).isMessenger === true) ||
      (user.role === Role.MANAGER && (user as any).isMessenger === true);
    if (!canWorkAsMessenger) return false;

    const userStores: Types.ObjectId[] = (user as any).stores || [];
    const storeId = store._id?.toString?.() || store.toString?.();
    if (userStores.some((s) => s.toString() === storeId)) return true;

    if (store.messengers?.some((id: Types.ObjectId) => id.toString() === user._id.toString())) {
      return true;
    }

    return (user as any).isPlatformMessenger === true;
  }

  /** Assign current user as messenger when taking the delivery (owner or eligible messenger). */
  async claimDeliveryIfNeeded(user: User): Promise<void> {
    if (this.isAssignedMessenger(user)) return;

    const assignedId = this.order.assignedMessenger?._id?.toString?.()
      ?? this.order.assignedMessenger?.toString?.();

    // Owner can proceed without reassigning an existing messenger.
    if (this.isStoreOwner(user) && assignedId) return;

    if (!this.isStoreOwner(user) && !this.isEligibleStoreMessenger(user)) return;

    this.order.assignedMessenger = user._id as any;
    await this.order.save();
  }

  /** @deprecated Prefer canManageStoreOrder */
  canManageBusinessOrder(user: User): boolean {
    return this.canManageStoreOrder(user);
  }
}
