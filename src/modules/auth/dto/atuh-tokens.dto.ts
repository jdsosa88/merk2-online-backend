import { ApiProperty } from "@nestjs/swagger";

export class AuthTokensDto {  
  @ApiProperty()
  readonly access_token: string;
  @ApiProperty()
  readonly refresh_token: string;
}