import { ApiProperty } from "@nestjs/swagger";

export class AuthTokensDto {  
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for API authorization'
  })
  readonly access_token: string;
  
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token for obtaining new access tokens'
  })
  readonly refresh_token: string;
}