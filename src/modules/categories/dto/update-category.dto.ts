import { CreateCategoryDto } from './create-category.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType, OmitType } from '@nestjs/mapped-types';

export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['parent', 'level'] as const)
) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}