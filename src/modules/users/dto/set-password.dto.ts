import { IsNotEmpty, IsString, Length } from "class-validator";

export class SetPasswordDto {

  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  readonly oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  readonly newPassword: string;
  
}