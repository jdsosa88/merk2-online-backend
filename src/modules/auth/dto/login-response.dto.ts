import { User } from "src/modules/users/schemas/user.schema";
import { AuthTokensDto } from "./atuh-tokens.dto";
import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
  @ApiProperty({
    type: User,
    description: 'Authenticated user information'
  })
  readonly user: User;
  
  @ApiProperty({
    type: AuthTokensDto,
    description: 'Authentication tokens (access and refresh)'
  })
  readonly tokens: AuthTokensDto;
}