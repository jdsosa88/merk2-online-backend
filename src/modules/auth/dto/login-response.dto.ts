import { User } from "src/modules/users/user.schema";
import { AuthTokensDto } from "./atuh-tokens.dto";
import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto{
  @ApiProperty()
  readonly user: User;
  @ApiProperty()
  readonly tokens: AuthTokensDto;

  constructor(user: User, tokens: AuthTokensDto){
    this.user = user;
    this.tokens = tokens;
  }
}