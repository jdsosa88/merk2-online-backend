import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { AppAbility, Action } from 'src/modules/casl/casl-ability.factory';
import { Business } from '../schemas/business.schema';
import { IsAuthorizedParams } from 'src/modules/users/types/policies.type';
import { Types } from 'mongoose';

export class CreateBusinessPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ ability, request, isOtherUser: false });
  }
}

const isAuthorized = (params: IsAuthorizedParams): boolean => {
  const { request, ability, isOtherUser } = params;  
  const caslBusiness = new Business();
  caslBusiness.owner = isOtherUser ? null : request.user._id;
  return ability.can(Action.CREATE, caslBusiness);
}
