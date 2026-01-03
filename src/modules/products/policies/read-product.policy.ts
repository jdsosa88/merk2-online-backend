import { Action, AppAbility } from "src/modules/casl/casl-ability.factory";
import { IPolicyHandler } from "src/modules/casl/interfaces/policy-handler.interface";
import { User } from "src/modules/users/schemas/user.schema";
import { Product } from "../schemas/product.schema";

export class ReadProductPolicy implements IPolicyHandler {
  handle(ability: AppAbility, user: User): boolean {
    return ability.can(Action.READ, Product);
  }
}