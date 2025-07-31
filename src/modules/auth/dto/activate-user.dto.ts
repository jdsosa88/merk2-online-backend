import { IsNotEmpty, IsNumberString, isNumberString, IsString, isString, Length, min } from "class-validator";

export class ActivateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly id: string;

  @IsString()
  @IsNumberString()
  @Length(6, 6)
  readonly code: string;

}