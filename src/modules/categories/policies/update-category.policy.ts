import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { AppAbility, Action } from 'src/modules/casl/casl-ability.factory';
import { Category } from '../schemas/category.schema';

export class UpdateCategoryPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {    
    return ability.can(Action.UPDATE, Category);
  }
}

