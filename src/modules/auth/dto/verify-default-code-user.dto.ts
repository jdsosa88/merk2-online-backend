import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, isNumberString, IsString, isString, Length, min } from "class-validator";

export class VerifyDefaultCodeUserDto {
  @ApiProperty({ example: '68bec9fdb83564195e6aa63d' })
  @IsNotEmpty()
  @IsString()
  readonly id: string;
  
  @ApiProperty({minLength: 6, maxLength: 6, example: '123456'})
  @IsNotEmpty()
  @IsNumberString()
  @Length(6, 6)
  readonly code: string;

}