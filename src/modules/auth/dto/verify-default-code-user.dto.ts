import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsString, Length } from "class-validator";

export class VerifyDefaultCodeUserDto {
  @ApiProperty({ example: '68bec9fdb83564195e6aa63d' })
  @IsString()
  @IsNotEmpty()
  readonly id: string;
  
  @ApiProperty({minLength: 6, maxLength: 6, example: '123456'})
  @Length(6, 6)
  @IsNumberString()
  @IsNotEmpty()
  readonly code: string;

}