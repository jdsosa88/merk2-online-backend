import { OrderState } from './order-state.abstract';
import { OrderStatus } from '../types/orders.type';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { BadRequestException } from '@nestjs/common';

export class TerminalState extends OrderState {
  async transitionTo(targetStatus: OrderStatus, user: User, dto: UpdateOrderStatusDto): Promise<void> {
    throw new BadRequestException(`Cannot transition from ${this.context.order.status} to ${targetStatus}`);
  }
}