import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ 
    example: 'ya29.a0AfH6SMB...',
    description: 'Google ID token received from Google Sign-In',
    minLength: 100
  })
  @IsNotEmpty()
  @IsString()  
  token: string;
}