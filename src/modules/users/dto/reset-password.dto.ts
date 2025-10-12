import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsString, Length } from "class-validator";

export class ResetPasswordDto {

  @ApiProperty({ minLength: 6, maxLength: 6, example: '123456' })
  @IsNumberString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty({ minLength: 8, maxLength: 50, example: 'newPassword123' })
  @Length(8, 50)
  @IsString()
  @IsNotEmpty()
  readonly newPassword: string;
}