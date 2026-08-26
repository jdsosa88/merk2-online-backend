import { OrderStatus } from '../types/orders.type';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { NonTerminalState, TerminteOrderParams } from './non-terminal.state';

export class RequestedState extends NonTerminalState {
  async transitionTo(targetStatus: OrderStatus, user: User, dto: UpdateOrderStatusDto): Promise<void> {
    switch (targetStatus) {
      case OrderStatus.IN_PREPARATION:
        return this.handleInPreparation(user, dto);
      case OrderStatus.REJECTED:
        const paramsRejected: TerminteOrderParams = {
          targetStatus, user, dto, hasPermission: () => this.context.canManageBusinessOrder(user)
        }
        return this.terminateOrder(paramsRejected);
      case OrderStatus.CANCELLED:
        const paramsCancelled: TerminteOrderParams = {
          targetStatus, user, dto, hasPermission: () => this.context.canCancelAsCustomer(user)
        }
        return this.terminateOrder(paramsCancelled);
      default:
        throw new BadRequestException(`Cannot transition from ${this.context.order.status} to ${targetStatus}`);
    }
  }


  private async handleInPreparation(user: User, dto: UpdateOrderStatusDto) {
    const hasPermission = this.context.canManageBusinessOrder(user);
    if (!hasPermission) {
      throw new ForbiddenException(`Only the store owner can mark the order as ${OrderStatus.IN_PREPARATION}`);
    }

    await this.context.updateOrder({
      status: OrderStatus.IN_PREPARATION,
      statusUpdatedAt: new Date(),
      updatedBy: user._id,
    });
  }
}