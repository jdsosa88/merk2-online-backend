import { User } from "src/modules/users/schemas/user.schema";
import { Action, AppAbility } from "../../casl/casl-ability.factory";
import { IPolicyHandler } from "../../casl/interfaces/policy-handler.interface";

export class ListUsersPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    const authUser: User = request.user;       
    const caslUser = new User();
    caslUser._id = authUser._id;    
    return ability.can(Action.LIST, caslUser);
  }
}