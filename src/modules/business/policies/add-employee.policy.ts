import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { AppAbility, Action } from 'src/modules/casl/casl-ability.factory';
import { Business } from '../schemas/business.schema';
import { IsAuthorizedParams } from 'src/modules/users/types/policies.type';
import { EmploymentRequest } from '../schemas/employment-request.schema';

export class AddEmployeePolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return isAuthorized({ ability, request, isOtherUser: false });
  }
}

const isAuthorized = (params: IsAuthorizedParams): boolean => {
  const { request, ability, isOtherUser } = params;    
  return ability.can(Action.CREATE, Business) && ability.can(Action.CREATE, EmploymentRequest);
}
