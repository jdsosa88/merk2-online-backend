import { Injectable } from '@nestjs/common';
import { AbilityBuilder, MongoAbility, createMongoAbility, InferSubjects, ExtractSubjectType } from '@casl/ability';
import { Role, User } from '../users/schemas/user.schema';

/**
 * Defines the possible actions that can be performed on resources
 */
export enum Action {
  MANAGE = 'manage', // Can perform any action (wildcard)
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  READ_OTHER = 'read_other',
  UPDATE_OTHER = 'update_other',
  DELETE_OTHER = 'delete_other',
}

export type Subjects = InferSubjects<typeof User> | 'all';
export type AppAbility = MongoAbility<[Action, Subjects]>;

/**
 * Factory for creating CASL abilities based on user roles
 * This factory generates permission rules that determine what actions
 * users can perform on different resources in the system.
 */
@Injectable()
export class CaslAbilityFactory {
  /**
   * Creates an ability instance with permissions based on the user's role
   * @param user The user for whom to create the ability
   * @returns An AppAbility instance with the appropriate permissions
   */
  createForUser(user: User): AppAbility {

    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    //users module
    cannot(Action.CREATE, User);
    can(Action.UPDATE, User, { _id: user._id });
    can(Action.DELETE, User, { _id: user._id });
    cannot(Action.LIST, User);
    cannot(Action.READ_OTHER, User);
    cannot(Action.UPDATE_OTHER, User);
    cannot(Action.DELETE_OTHER, User);

    switch (user.role) {
      case Role.ADMIN:
        can(Action.MANAGE, 'all');
        break;

      case Role.PROVIDER:
        can(Action.READ, User);
        break;

      case Role.MESSENGER:
        can(Action.READ, User);
        break;

      case Role.CUSTOMER:
        can(Action.READ, User, { _id: user._id });
        break;

      default:
        // No permissions for unknown roles
        break;
    }


    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>
    });
  }
}
