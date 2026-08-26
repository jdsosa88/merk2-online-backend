import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { Action, AppAbility } from 'src/modules/casl/casl-ability.factory';
import { SellerApplication } from '../schemas/seller-application.schema';

export class CreateSellerApplicationPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.CREATE, SellerApplication);
  }
}

export class ReadOwnSellerApplicationPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.READ, SellerApplication);
  }
}

export class ListSellerApplicationsPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.LIST, SellerApplication);
  }
}

export class ReviewSellerApplicationPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.UPDATE, SellerApplication);
  }
}
