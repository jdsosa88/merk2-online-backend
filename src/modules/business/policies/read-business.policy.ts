import { Action, AppAbility } from "src/modules/casl/casl-ability.factory";
import { IPolicyHandler } from "src/modules/casl/interfaces/policy-handler.interface";
import { User } from "src/modules/users/schemas/user.schema";
import { Business } from "../schemas/business.schema";

export class ReadBusinessPolicy implements IPolicyHandler {
  handle(ability: AppAbility, user: User): boolean {
    return ability.can(Action.READ, Business);
  }
}