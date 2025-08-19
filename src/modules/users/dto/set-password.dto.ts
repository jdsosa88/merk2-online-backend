import { IsNotEmpty, IsString, Length } from "class-validator";

export class SetPasswordDto {

  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly newPassword: string;
  
}