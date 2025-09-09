import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class SetPasswordDto {

  @ApiProperty({ minLength: 8, maxLength: 50, example: 'oldPassword123' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly oldPassword: string;

  @ApiProperty({ minLength: 8, maxLength: 50, example: 'newPassword123' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly newPassword: string;
  
}