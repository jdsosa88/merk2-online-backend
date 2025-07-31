import { IsEmail, IsNotEmpty, IsNumberString, IsString, Length } from "class-validator";

export class VerifyResetCodeDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsNumberString()
  readonly code: string;
}