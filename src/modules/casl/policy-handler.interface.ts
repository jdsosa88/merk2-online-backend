import { AppAbility } from './casl-ability.factory';

export interface IPolicyHandler {
  handle(ability: AppAbility, req?: any): boolean;
}

export type PolicyHandlerCallback = (ability: AppAbility, req?: any) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;