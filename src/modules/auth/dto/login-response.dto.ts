import { User } from "src/modules/users/schemas/user.schema";
import { AuthTokensDto } from "./atuh-tokens.dto";
import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto{
  @ApiProperty()
  readonly user: User;
  @ApiProperty()
  readonly tokens: AuthTokensDto;
}