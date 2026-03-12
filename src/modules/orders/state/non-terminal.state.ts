// non-terminal.state.ts
import { OrderState } from './order-state.abstract';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { OrderStatus } from '../types/orders.type';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

export type TerminteOrderParams = {
  targetStatus: OrderStatus;
  user: User;
  dto: UpdateOrderStatusDto;
  hasPermission: () => boolean;
};

export abstract class NonTerminalState extends OrderState {
  protected async terminateOrder(params: TerminteOrderParams): Promise<void> {
    const {targetStatus, user, dto, hasPermission} = params;
    if (!hasPermission()) {
      throw new ForbiddenException(`You do not have permission to mark the status as ${targetStatus}`);
    }
    if (!dto.reason) {
      throw new BadRequestException(`A reason is required to mark the order status as ${targetStatus}.`);
    }
    await this.context.returnOrderStock();
    if (targetStatus === OrderStatus.RETURNED) {
      await this.context.createPendingDeliveryCharge(dto.reason);
    }
    await this.context.updateOrder({
      status: targetStatus,
      statusUpdatedAt: new Date(),
      updatedBy: user._id,
      cancellationReason: dto.reason,
    });
  }
}