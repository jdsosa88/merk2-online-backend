import { User } from "src/modules/users/user.schema";
import { AuthTokensDto } from "./atuh-tokens.dto";

export class LoginResponseDto{
  readonly user: User;
  readonly tokens: AuthTokensDto;

  constructor(user: User, tokens: AuthTokensDto){
    this.user = user;
    this.tokens = tokens;
  }
}