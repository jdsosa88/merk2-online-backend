
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsBoolean, IsNumber, Min, Max, IsArray, IsMongoId, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '@nestjs/mapped-types';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['business'] as const)
) {
  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  averageRating?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timesOrdered?: number; 
}