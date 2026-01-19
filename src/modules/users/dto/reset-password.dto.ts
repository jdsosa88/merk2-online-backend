import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsString, Length, Matches } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ 
    minLength: 6, 
    maxLength: 6, 
    example: '123456',
    description: '6-digit verification code received via email'
  })
  @IsNumberString()
  @IsNotEmpty()
  readonly code: string;

  @ApiProperty({ 
    minLength: 8, 
    maxLength: 50, 
    example: 'NewPassword123!',
    description: 'New password (8-50 characters, at least one uppercase letter, one lowercase letter, and one number)',
    writeOnly: true
  })
  @Length(8, 50)
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  )
  readonly newPassword: string;
}