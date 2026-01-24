import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray } from 'class-validator';

export class RemoveCategoriesDto {
  @ApiProperty({
    type: [String],
    example: ['60d5f9f8f8b7a12c3c4d5e6f', '60d5f9f8f8b7a12c3c4d5e70'],
    description: 'Array of category IDs to remove from the business',
  })
  @IsArray()
  @ArrayMinSize(1)  
  categories: string[];
}