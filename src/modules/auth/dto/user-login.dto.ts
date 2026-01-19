import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class UserLoginDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Registered user email address',
    format: 'email'
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ 
    example: 'Password123!',
    description: 'User password',
    writeOnly: true
  })
  @Length(8, 50)
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}