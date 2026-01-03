import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { AppAbility, Action } from 'src/modules/casl/casl-ability.factory';
import { Category } from '../schemas/category.schema';

export class CreateCategoryPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return ability.can(Action.CREATE, Category);
  }
}


