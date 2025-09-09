import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsString, Length } from "class-validator";

export class ResetPasswordDto {

  @ApiProperty({ minLength: 6, maxLength: 6, example: '123456' })
  @IsNotEmpty()
  @IsNumberString()
  readonly code: string;

  @ApiProperty({ minLength: 8, maxLength: 50, example: 'newPassword123' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly newPassword: string;
}