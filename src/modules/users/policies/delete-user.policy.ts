import { Role, User } from "src/modules/users/schemas/user.schema";
import { Action, AppAbility } from "../../casl/casl-ability.factory";
import { IPolicyHandler } from "../../casl/interfaces/policy-handler.interface";
import { Types } from "mongoose";
import { IsAuthorizedParams } from "../types/policies.type";

export class DeleteUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ability, request, isOtherUser: false});
  }
}

export class DeleteOtherUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ability, request, isOtherUser: true});
  }
}

const isAuthorized = (params: IsAuthorizedParams): boolean => {
  {
    const { request, ability, isOtherUser } = params;
    const id: string = request.query.id;
    if (isOtherUser && !id || !isOtherUser && id) return false;
    const authUser: User = request.user;
    if (isOtherUser && id === String(authUser._id)) return false;
    if(!isOtherUser && authUser.role === Role.ADMIN) return false;
    const caslUser = new User();
    caslUser._id = isOtherUser ? new Types.ObjectId(id) : authUser._id;
    return ability.can(Action.DELETE, caslUser);
  }
}