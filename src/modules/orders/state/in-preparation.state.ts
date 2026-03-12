import { OrderStatus } from '../types/orders.type';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { NonTerminalState, TerminteOrderParams } from './non-terminal.state';

export class InPreparationState extends NonTerminalState {
  async transitionTo(targetStatus: OrderStatus, user: User, dto: UpdateOrderStatusDto): Promise<void> {
    switch (targetStatus) {
      case OrderStatus.READY_FOR_DELIVERY:
        return this.handleReadyForDelivery(user, dto);
      case OrderStatus.ABORTED:
        const paramsAborted: TerminteOrderParams = {
          targetStatus, user, dto, hasPermission: () => this.context.canManageBusinessOrder(user)
        }
        return this.terminateOrder(paramsAborted);
      case OrderStatus.CANCELLED:
        const paramsCancelled: TerminteOrderParams = {
          targetStatus, user, dto, hasPermission: () => this.context.canCancelAsCustomer(user)
        }
        return this.terminateOrder(paramsCancelled);
      default:
        throw new BadRequestException(`Cannot transition from ${this.context.order.status} to ${targetStatus}`);
    }
  }

  private async handleReadyForDelivery(user: User, dto: UpdateOrderStatusDto) {
    const hasPermission = this.context.canManageBusinessOrder(user);
    if (!hasPermission) {
      throw new ForbiddenException(`Only the business owner or manager can mark the order as ${OrderStatus.READY_FOR_DELIVERY}`);
    }

    await this.context.updateOrder({
      status: OrderStatus.READY_FOR_DELIVERY,
      statusUpdatedAt: new Date(),
      updatedBy: user._id,
    });
    
    await this.context.autoAssignMessenger();
  }
}