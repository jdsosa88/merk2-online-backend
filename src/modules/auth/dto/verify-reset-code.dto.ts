import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumberString } from "class-validator";

export class VerifyResetCodeDto {
  @ApiProperty({ example: 'user.example@email.com' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({minLength: 6, maxLength: 6, example: '123456'})
  @IsNotEmpty()
  @IsNumberString()
  readonly code: string;
}