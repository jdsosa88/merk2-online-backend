import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { Action, AppAbility } from 'src/modules/casl/casl-ability.factory';
import { Notification } from '../schemas/notification.schema';

export class ListNotificationsPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.LIST, Notification);
  }
}

export class ReadNotificationPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.READ, Notification);
  }
}

export class DeleteNotificationPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.DELETE, Notification);
  }
}

export class UpdateNotificationPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.UPDATE, Notification);
  }
}

export class BroadcastNotificationPolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.MANAGE, Notification);
  }
}
