import { AppAbility } from "src/modules/casl/casl-ability.factory";

export type IsAuthorizedParams = {
  ability: AppAbility,
  request: any,
  isOtherUser: boolean,
}