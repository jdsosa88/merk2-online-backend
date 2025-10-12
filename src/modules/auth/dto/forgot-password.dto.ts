import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user.example@email.com' })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}