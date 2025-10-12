import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class UserLoginDto {

  @ApiProperty({ example: 'user.example@email.com' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: 'pass1234' })
  @Length(8, 50)
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}