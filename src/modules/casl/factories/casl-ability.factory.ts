import { Injectable } from '@nestjs/common';
import { AbilityBuilder, MongoAbility, createMongoAbility, InferSubjects, ExtractSubjectType } from '@casl/ability';
import { Role, User, UserDocument } from '../../users/schemas/user.schema';

/**
 * Defines the possible actions that can be performed on resources
 */
export enum Action {
  MANAGE = 'manage', // Can perform any action (wildcard)
  CREATE = 'create',  
  READ = 'read',
  READ_OTHER= 'read_other',
  UPDATE = 'update',  
  UPDATE_OTHER = 'update_other',
  DELETE = 'delete',
  DELETE_OTHER = 'delete_other',
  LIST = 'list'
}

export type Subjects = InferSubjects< typeof User > | 'all';
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
  createForUser(user: UserDocument): AppAbility {

    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    //users module
    cannot(Action.CREATE, User);
    cannot(Action.READ_OTHER, User);
    can(Action.UPDATE, User, { _id: user._id });
    cannot(Action.UPDATE_OTHER, User);    
    can(Action.DELETE, User, { _id: user._id });
    cannot(Action.DELETE_OTHER, User);
    cannot(Action.LIST, User);

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
