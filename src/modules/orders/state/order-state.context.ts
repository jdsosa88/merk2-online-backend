import { OrderDocument } from '../schemas/order.schema';
import { OrderStatus } from '../types/orders.type';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ProductsService } from '../../products/products.service';
import { Model, Types } from 'mongoose';
import { PendingChargeDocument } from '../schemas/pending-charge.schema';
import { BusinessService } from '../../business/business.service';
import { UsersService } from '../../users/users.service';
import { MessengerInDeliveryDocument } from '../schemas/messengers-in-delivery.schema';
import { OrderState } from './order-state.abstract';
import { RequestedState } from './requested.state';
import { InPreparationState } from './in-preparation.state';
import { ReadyForDeliveryState } from './ready-for-delivery.state';
import { OnTheWayState } from './on-the-way.state';
import { TerminalState } from './terminal.state';
import { Role } from '../../users/types/users.type';
import { MessengerAssigmentType } from '../../business/types/business.type';

export class OrderStateContext {
  private state: OrderState;

  constructor(
    public readonly order: OrderDocument,
    private readonly productsService: ProductsService,
    private readonly pendingChargeModel: Model<PendingChargeDocument>,
    private readonly businessService: BusinessService,
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
    const business = this.order.business as any;
    if (business.messengerAssigmentType !== MessengerAssigmentType.AUTOMATIC) return;

    const possibleAssignees = [
      ...(business.employees?.messengers || []),
      ...(business.employees?.managers || []),
      business.owner,
    ];

    for (const assigneeId of possibleAssignees) {
      try {
        const user = await this.usersService.findOne(assigneeId.toString());
        const canWorkAsMessenger = (user.role === Role.PROVIDER || user.role === Role.MANAGER)
          && (user as any).isMessenger === true;
        if (user.role !== Role.MESSENGER && !canWorkAsMessenger) continue;

        const messengerUser = user as any;
        let isAssociated = false;
        if (messengerUser.businesses?.length > 0) {
          isAssociated = messengerUser.businesses.some((bId: Types.ObjectId) => bId.toString() === business._id.toString());
        } else if (messengerUser.business) {
          isAssociated = messengerUser.business.toString() === business._id.toString();
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

  //Validations
  isCustomer(user: User): boolean {
    return this.order.customer._id.toString() === user._id.toString();
  }

  isBusinessOwnerOrManager(user: User): boolean {
    const business = this.order.business as any;
    return business.owner.toString() === user._id.toString() ||
      business.employees?.managers?.some(
        (managerId: Types.ObjectId) => managerId.toString() === user._id.toString()
      );
  }

  isAssignedMessenger(user: User): boolean {
    const assignedMessenger = this.order.assignedMessenger?._id?.toString();
    return assignedMessenger === user._id.toString();
  }

  canAbort(user: User): boolean {
    if (this.order.status === OrderStatus.ON_THE_WAY) {
      return this.isAssignedMessenger(user);
    }
    return this.isBusinessOwnerOrManager(user);
  }

  canCancelAsCustomer(user: User): boolean {
    return this.isCustomer(user);
  }

  canManageBusinessOrder(user: User): boolean {
    if (
      this.order.status === OrderStatus.READY_FOR_DELIVERY ||
      this.order.status === OrderStatus.ON_THE_WAY
    ) {
      return this.isAssignedMessenger(user);
    }
    return this.isBusinessOwnerOrManager(user);
  }
}