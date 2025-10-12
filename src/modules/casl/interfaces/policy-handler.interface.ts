import { AppAbility } from '../casl-ability.factory';

export interface IPolicyHandler {
  handle(ability: AppAbility, request?: any): boolean;
}

export type PolicyHandlerCallback = (ability: AppAbility, request?: any) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;