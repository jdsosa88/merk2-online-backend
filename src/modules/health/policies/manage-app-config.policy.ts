import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { AppAbility, Action } from 'src/modules/casl/casl-ability.factory';
import { AppConfig } from '../schemas/app-config.schema';

export class ManageAppConfigPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    return ability.can(Action.MANAGE, AppConfig);
  }
}