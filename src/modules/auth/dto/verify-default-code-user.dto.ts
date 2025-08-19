import { IsNotEmpty, IsNumberString, isNumberString, IsString, isString, Length, min } from "class-validator";

export class VerifyDefaultCodeUserDto {
  @IsNotEmpty()
  @IsString()
  readonly id: string;
  
  @IsNotEmpty()
  @IsNumberString()
  @Length(6, 6)
  readonly code: string;

}