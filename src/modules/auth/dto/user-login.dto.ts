import { IsNotEmpty, IsString, Length } from "class-validator";

export class UserLoginDto {

  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly password: string;
}