import { User } from "src/modules/users/schemas/user.schema";
import { Action, AppAbility } from "../../casl/casl-ability.factory";
import { IPolicyHandler } from "../../casl/interfaces/policy-handler.interface";
import { ObjectValidationsUtils } from "src/common/utils/object-validations";

export class CreateAdminUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request?: any): boolean {   
    return ability.can(Action.CREATE, User);
  }
}

export class ReadUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request?: any): boolean {
    // const rule = ability.relevantRuleFor(Action.READ, User);
    // console.log(rule);    
    return ability.can(Action.READ, User);
  }
}

export class ReadOtherUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request?: any): boolean {
    return ability.can(Action.READ_OTHER, User);
  }
}

export class ManageUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request?: any): boolean {
    return ability.can(Action.MANAGE, User);
  }
}

export class UpdateUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request?: any): boolean {
    const objectUtils = new ObjectValidationsUtils();
    const { _id, __v } = request?.body;    
    const updateUserDto: any = request?.body ? request.body : null;

    const hasForbiddenFields: boolean = objectUtils.hasDatabaseForbiddenObject(_id, __v);    
    const hasRestrictedFields: boolean = objectUtils.isDefinedObject(updateUserDto) && (
      objectUtils.isDefinedObject(updateUserDto.role)
      || objectUtils.isDefinedObject(updateUserDto.password)
      || objectUtils.isDefinedObject(updateUserDto.isActive)
    );

    if (hasForbiddenFields || hasRestrictedFields) {
      return false;
    }
    return ability.can(Action.UPDATE, User);
  }
}

export class UpdateOtherUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility, request?: any): boolean {
    const objectUtils = new ObjectValidationsUtils();
    const { _id, __v } = request?.body;   

    const hasForbiddenFields: boolean = objectUtils.hasDatabaseForbiddenObject(_id, __v); 

    if (hasForbiddenFields) {
      return false;
    }
    return ability.can(Action.UPDATE_OTHER, User);
  }
}

export class DeleteUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.DELETE, User);
  }
}

export class DeleteOtherUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.DELETE_OTHER, User);
  }
}

export class ListUsersPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.LIST, User);
  }
}
