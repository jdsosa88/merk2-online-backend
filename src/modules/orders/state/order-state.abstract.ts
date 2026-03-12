import { OrderStatus } from '../types/orders.type';
import { OrderDocument } from '../schemas/order.schema';
import { User } from '../../users/schemas/user.schema';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { OrderStateContext } from './order-state.context';

export abstract class OrderState {
  constructor(protected context: OrderStateContext) {}

  abstract transitionTo(
    targetStatus: OrderStatus,
    user: User,
    dto: UpdateOrderStatusDto,
  ): Promise<void>;
}