import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { Action, AppAbility } from 'src/modules/casl/casl-ability.factory';
import { DeliveryZone } from '../schemas/delivery-zone.schema';
import { PlatformDeliveryConfig } from '../schemas/platform-delivery-config.schema';

export class ReadDeliveryZonePolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.READ, DeliveryZone);
  }
}

export class ManageDeliveryZonePolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.MANAGE, DeliveryZone);
  }
}

export class ManagePlatformDeliveryConfigPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.MANAGE, PlatformDeliveryConfig);
  }
}
