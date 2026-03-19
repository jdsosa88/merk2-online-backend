import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateImageFromUrlDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false, example: 'Profile picture' })
  @IsOptional()
  @IsString()
  alt?: string;
}