import { User } from "src/modules/users/schemas/user.schema";
import { Action, AppAbility } from "../../casl/casl-ability.factory";
import { IPolicyHandler } from "../../casl/interfaces/policy-handler.interface";
import { ObjectValidationsUtils } from "src/common/utils/object-validations";
import { Types } from "mongoose";
import { IsAuthorizedParams } from "../types/policies.type";

export class UpdateUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ ability, request, isOtherUser: false });
  }
}

export class UpdateOtherUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ ability, request, isOtherUser: true });
  }
}

export class UpdateUserPasswordPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    const id: string = request.query.id;
    if (id) return false;
    const authUser: User = request.user;
    const caslUser = new User();
    caslUser._id = authUser._id;
    return ability.can(Action.UPDATE_RESTRICTED_FIELDS, caslUser, 'password');
  }
}

const isAuthorized = (params: IsAuthorizedParams): boolean => {
  {
    const { request, ability, isOtherUser } = params;
    const id: string = request.query.id;
    if (isOtherUser && !id || !isOtherUser && id) return false;
    const authUser: User = request.user;
    if (isOtherUser && id === String(authUser._id)) return false;
    const caslUser = new User();
    caslUser._id = isOtherUser ? new Types.ObjectId(id) : authUser._id;
    const allowedKeys: string[] = Object.keys(caslUser);
    for (const field of allowedKeys) {
      if (field in caslUser && request.body[field] !== undefined) {
        const isAuthorizedField = ability.can(Action.UPDATE, caslUser, field);
        if (isAuthorizedField === false) return false;
      }
    };
    return true;
  }
}
