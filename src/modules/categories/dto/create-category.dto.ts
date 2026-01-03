import { IsString, IsOptional, IsArray, IsBoolean, IsMongoId, MinLength, MaxLength, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateCategoryDto {
  @ApiProperty({ minLength: 2, maxLength: 100, example: 'Electronics' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ type: [String], description: 'Direct subcategories Ids' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  subcategories?: string[];

  @ApiPropertyOptional({ type: Types.ObjectId, description: 'Direct parent Id' })
  @IsOptional()  
  @IsMongoId()  
  parent?: string;

  @ApiPropertyOptional({ example: 'Category description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'icon-name' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#FF5733' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  level?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRoot?: boolean;
}