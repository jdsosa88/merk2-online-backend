import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { Action, AppAbility } from '../../casl/casl-ability.factory';
import { Business } from '../schemas/business.schema';

export class DeleteBusinessPolicy implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.DELETE, Business);
  }
}