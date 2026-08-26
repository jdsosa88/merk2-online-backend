import { IPolicyHandler } from 'src/modules/casl/interfaces/policy-handler.interface';
import { Action, AppAbility } from 'src/modules/casl/casl-ability.factory';
import { Store } from '../../stores/schemas/store.schema';

/** Provider managing own stores implies team management. */
export class ManageTeamPolicy implements IPolicyHandler {
  handle(ability: AppAbility, request: any): boolean {
    const store = new Store();
    store.owner = request.user._id;
    return ability.can(Action.UPDATE, store) || ability.can(Action.CREATE, store);
  }
}
