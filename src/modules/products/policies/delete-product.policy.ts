import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { AppAbility, Action } from 'src/modules/casl/casl-ability.factory';
import { Product } from '../schemas/product.schema';

export class DeleteProductPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {    
    return ability.can(Action.DELETE, Product);
  }
}

