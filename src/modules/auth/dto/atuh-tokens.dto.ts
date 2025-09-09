import { ApiProperty } from "@nestjs/swagger";

export class AuthTokensDto {  
  @ApiProperty()
  readonly access_token: string;
  @ApiProperty()
  readonly refresh_token: string;

  constructor(access_token: string, refresh_token: string) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
  }
}