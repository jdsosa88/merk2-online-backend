import { OrderStatus } from '../types/orders.type';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { NonTerminalState, TerminteOrderParams } from './non-terminal.state';

export class ReadyForDeliveryState extends NonTerminalState {
  async transitionTo(targetStatus: OrderStatus, user: User, dto: UpdateOrderStatusDto): Promise<void> {
    switch (targetStatus) {
      case OrderStatus.ON_THE_WAY:
        return this.handleOnTheWay(user, dto);
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

  private async handleOnTheWay(user: User, dto: UpdateOrderStatusDto) {
    const hasPermission = this.context.canManageBusinessOrder(user);
    if (!hasPermission) {
      throw new ForbiddenException(`Only the assigned messenger can mark the order as ${OrderStatus.ON_THE_WAY}.`);
    }

    const updateData: any = {
      status: OrderStatus.ON_THE_WAY,
      statusUpdatedAt: new Date(),
      updatedBy: user._id,
    };

    if (dto.trackingNumber) {
      updateData.trackingNumber = dto.trackingNumber;
    }

    if (dto.estimatedDeliveryTime) {
      updateData.estimatedDeliveryTime = dto.estimatedDeliveryTime;
    }

    await this.context.updateOrder(updateData);
  }
}