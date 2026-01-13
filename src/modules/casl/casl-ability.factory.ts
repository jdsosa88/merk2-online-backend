import { Injectable } from '@nestjs/common';
import { AbilityBuilder, MongoAbility, createMongoAbility, InferSubjects, ExtractSubjectType } from '@casl/ability';
import { User } from '../users/schemas/user.schema';
import { Business } from '../business/schemas/business.schema';
import { Role } from '../users/types/users.type';
import { EmploymentRequest } from '../business/schemas/employment-request.schema';
import { Product } from '../products/schemas/product.schema';
import { Category } from '../categories/schemas/category.schema';
import { AppConfig } from '../health/schemas/app-config.schema';

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
  UPDATE_RESTRICTED_FIELDS = 'update_restricted_fields',
}

export type Subjects = InferSubjects<
  typeof User
  | typeof Business
  | typeof EmploymentRequest
  | typeof Category
  | typeof Product
  | typeof AppConfig
> 
| 'Health'
|'all';

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
    can(Action.DELETE, User, { _id: user._id });
    can(Action.UPDATE, User, { _id: user._id });
    cannot(Action.UPDATE, User, ['_id', 'password', 'isActive', 'role']);
    can(Action.UPDATE_RESTRICTED_FIELDS, User, ['password'], { _id: user._id });
    cannot(Action.LIST, User);

    can(Action.READ, Category);
    can(Action.READ, Product);
    can(Action.READ, Business);
    can(Action.READ, 'Health');
    cannot(Action.MANAGE, AppConfig);

    //Role based module
    switch (user.role) {
      case Role.ADMIN:
        can(Action.MANAGE, 'all');
        cannot(Action.UPDATE, User, ['_id']);
        cannot(Action.UPDATE, User, ['isActive', 'role'], { _id: user._id });
        cannot(Action.CREATE, Business, { owner: user._id });
        break;

      case Role.PROVIDER:
        can(Action.READ, User);
        can(Action.CREATE, Business, { owner: user._id });
        can(Action.UPDATE, Business, { owner: user._id });
        can(Action.CREATE, EmploymentRequest, { invitedBy: user._id });
        can(Action.UPDATE, EmploymentRequest, ['status'], { invitedBy: user._id });
        can(Action.MANAGE, Product);
        break;

      case Role.MANAGER:
        can(Action.READ, User);
        can(Action.MANAGE, Product);
        break;

      case Role.MESSENGER:
        can(Action.READ, User);
        break;

      case Role.CUSTOMER:
        can(Action.READ, User, { _id: user._id });
        can(Action.CREATE, Business, { owner: user._id });
        can(Action.UPDATE, Business, { owner: user._id });
        can(Action.UPDATE, EmploymentRequest, ['status'], { user: user._id });
        break;

      default:
        cannot(Action.MANAGE, 'all');
        break;
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>
    });
  }


}
