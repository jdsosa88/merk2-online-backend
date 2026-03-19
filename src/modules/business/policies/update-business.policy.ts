import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { AppAbility, Action } from 'src/modules/casl/casl-ability.factory';
import { Business } from '../schemas/business.schema';
import { IsAuthorizedParams } from 'src/modules/users/types/policies.type';

export class UpdateBusinessPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ ability, request, isOtherUser: false });
  }
}

export class UpdateBusinessByAdminPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ ability, request, isOtherUser: true });
  }
}

export class UpdateBusinessImagePolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ ability, request, isOtherUser: false }) ||
      isAuthorized({ ability, request, isOtherUser: true });
  }
}

const isAuthorized = (params: IsAuthorizedParams): boolean => {
  const { request, ability, isOtherUser } = params;
  const caslBusiness = new Business();
  caslBusiness.owner = isOtherUser ? null : request.user._id;
  return ability.can(Action.UPDATE, caslBusiness);
}
