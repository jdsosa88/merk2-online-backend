import { IsNotEmpty, IsNumberString, IsString, Length } from "class-validator";

export class ResetPasswordDto {

  @IsNotEmpty()
  @IsNumberString()
  readonly code: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly newPassword: string;
}