import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class SetPasswordDto {
  @ApiProperty({ 
    minLength: 8, 
    maxLength: 50, 
    example: 'OldPassword123!',
    description: 'Current password',
    writeOnly: true
  })
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly oldPassword: string;

  @ApiProperty({ 
    minLength: 8, 
    maxLength: 50, 
    example: 'NewPassword456!',
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