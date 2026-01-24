import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { Action, AppAbility } from '../../casl/casl-ability.factory';
import { Business } from '../schemas/business.schema';

export class RequestDeleteBusinessPolicy implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.REQUEST_DELETE, Business);
  }
}