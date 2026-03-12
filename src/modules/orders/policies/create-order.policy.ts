import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { AppAbility, Action } from '../../casl/casl-ability.factory';
import { Order } from '../schemas/order.schema';

export class CreateOrderPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.CREATE, Order);
  }
}