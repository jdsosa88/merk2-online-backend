
import { Injectable, ForbiddenException } from '@nestjs/common';
import { CaslAbilityFactory, AppAbility, Action, Subjects } from '../../modules/casl/casl-ability.factory';
import { User } from '../../modules/users/schemas/user.schema';

@Injectable()
export class AuthorizationService {
  constructor(private readonly caslAbilityFactory: CaslAbilityFactory) { }

  /**
   * Verifica si el usuario puede realizar una acción sobre un sujeto
   */
  checkAbility(user: User, action: Action, subject: Subjects): boolean {
    const ability = this.caslAbilityFactory.createForUser(user);
    return ability.can(action, subject);
  }

  /**
   * Lanza excepción si el usuario no tiene permiso
   */
  throwIfCannot(user: User, action: Action, subject: Subjects, fields?: string[]): void {
    if (!this.checkAbility(user, action, subject)) {
      throw new ForbiddenException(
        `You are not allowed to ${action} this ${this.getSubjectType(subject)}`
      );
    }
    if (fields && fields.length > 0) {
      for (const field of fields) {
        if (!this.canAccessField(user, action, subject, field)) {
          throw new ForbiddenException(
            `You are not allowed to ${action} field ${field} on this ${this.getSubjectType(subject)}`
          );
        }
      }
    }
  }

  /**
   * Filtra datos basado en permisos del usuario
   */
  filterByAbility<T extends Subjects>(user: User, action: Action, subjects: T[]): T[] {
    const ability = this.caslAbilityFactory.createForUser(user);
    return subjects.filter((subject: T) => ability.can(action, subject));
  }

  /**
   * Verifica permisos para campos específicos
   */
  canAccessField(user: User, action: Action, subject: Subjects, field: string): boolean {
    const ability = this.caslAbilityFactory.createForUser(user);
    return ability.can(Action.UPDATE, subject, field);
  }

  /**
   * Obtiene el tipo del sujeto para mensajes de error
   */
  private getSubjectType(subject: Subjects): string {
    if (typeof subject === 'string') {
      return subject;
    }
    if (subject && subject.constructor) {
      return subject.constructor.name;
    }
    return 'resource';
  }
}