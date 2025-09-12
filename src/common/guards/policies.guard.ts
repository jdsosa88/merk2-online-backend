import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../../modules/casl/factories/casl-ability.factory';
import { PolicyHandler } from '../../modules/casl/interfaces/policy-handler.interface';
import { CHECK_POLICIES_KEY } from '../../modules/casl/decorators/policies.decorator';
import { User } from '../../modules/users/schemas/user.schema';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(CHECK_POLICIES_KEY, context.getHandler()) || [];

    if (policyHandlers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;    ;

    const ability = this.caslAbilityFactory.createForUser(user);

    const hasPermission = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability, request),
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return hasPermission;
  }
  private execPolicyHandler(handler: PolicyHandler, ability: any, req?: any): boolean {
    if (typeof handler === 'function') {
      return handler(ability, req);
    }
    return handler.handle(ability, req);
  }
}