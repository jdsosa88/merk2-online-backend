import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CaslAbilityFactory, AppAbility } from '../../modules/casl/casl-ability.factory';

export const Ability = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<AppAbility> => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const caslAbilityFactory = ctx
      .switchToHttp()
      .getRequest()
      .caslAbilityFactory as CaslAbilityFactory;
    
    return caslAbilityFactory.createForUser(user);
  },
);
