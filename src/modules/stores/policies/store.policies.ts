import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { Action, AppAbility } from 'src/modules/casl/casl-ability.factory';
import { Store } from '../schemas/store.schema';

export class CreateStorePolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    const store = new Store();
    store.owner = request.user._id;
    return ability.can(Action.CREATE, store);
  }
}

export class ReadStorePolicy implements IPolicyHandler {
  handle(ability: AppAbility): boolean {
    return ability.can(Action.READ, Store);
  }
}

export class UpdateStorePolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    const store = new Store();
    store.owner = request.user._id;
    return ability.can(Action.UPDATE, store);
  }
}

export class ManageStoreMessengersPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    const store = new Store();
    store.owner = request.user._id;
    return ability.can(Action.UPDATE, store);
  }
}

/** Owner, messenger o manager asignado — validación fina en StoresService. */
export class ManageStoreDeliveryConfigPolicy implements IPolicyHandler {
  handle(_ability: AppAbility, request: any): boolean {
    const role = request.user?.role;
    return ['PROVIDER', 'MESSENGER', 'MANAGER', 'ADMIN'].includes(role);
  }
}
