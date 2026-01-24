import { Action, AppAbility } from "src/modules/casl/casl-ability.factory";
import { Business } from "../schemas/business.schema";
import { IPolicyHandler } from "src/modules/casl/interfaces/policy-handler.interface";

export class ListBusinessPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.LIST, Business);
  }
}