import { OrderState } from './order-state.abstract';
import { OrderStatus } from '../types/orders.type';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role } from '../../users/types/users.type';
import { Types } from 'mongoose';
import { NonTerminalState, TerminteOrderParams } from './non-terminal.state';

export class OnTheWayState extends NonTerminalState {
  async transitionTo(targetStatus: OrderStatus, user: User, dto: UpdateOrderStatusDto): Promise<void> {
    switch (targetStatus) {
      case OrderStatus.COMPLETED:
        return this.handleCompleted(user, dto);
      case OrderStatus.ABORTED:
        const paramsAborted: TerminteOrderParams = {
          targetStatus, user, dto, hasPermission: () => this.context.canManageBusinessOrder(user)
        }
        return this.terminateOrder(paramsAborted);
      case OrderStatus.RETURNED:
        const paramsReturned: TerminteOrderParams = {
          targetStatus, user, dto, hasPermission: () => this.context.canManageBusinessOrder(user)
        }
        return this.terminateOrder(paramsReturned);
      default:
        throw new BadRequestException(`Cannot transition from ${this.context.order.status} to ${targetStatus}`);
    }
  }

  private async handleCompleted(user: User, dto: UpdateOrderStatusDto) {
    const hasPermission = this.context.canManageDelivery(user);
    if (!hasPermission) {
      throw new ForbiddenException(
        `Only the store owner or the assigned messenger can mark the order as ${OrderStatus.COMPLETED}.`,
      );
    }

    await this.context.claimDeliveryIfNeeded(user);
    await this.context.incrementOrderProductsTimesOrdered();

    await this.context.updateOrder({
      status: OrderStatus.COMPLETED,
      deliveredVia: 'manual',
      statusUpdatedAt: new Date(),
      updatedBy: user._id,
    });
  }
}