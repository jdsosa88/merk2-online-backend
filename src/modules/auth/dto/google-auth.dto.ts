import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ example: '1234eweqqw1212sasa1' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
