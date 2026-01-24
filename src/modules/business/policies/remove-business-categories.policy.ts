import { Action, AppAbility } from "src/modules/casl/casl-ability.factory";
import { IPolicyHandler } from "src/modules/casl/interfaces/policy-handler.interface";
import { Business } from "../schemas/business.schema";


export class RemoveBusinessCategoriesPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.UPDATE, Business);
  }
}