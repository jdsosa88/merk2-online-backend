import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ParentCategoryDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  level: number;

  @ApiProperty()
  isRoot: boolean;
}

class SubcategoryDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [SubcategoryDto] })
  @Type(() => SubcategoryDto)
  subcategories: SubcategoryDto[];

  @ApiProperty()
  level: number;

  @ApiProperty()
  isActive: boolean;
}

export class CategoryResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [SubcategoryDto] })
  @Type(() => SubcategoryDto)
  subcategories: SubcategoryDto[];

  @ApiProperty({ type: [ParentCategoryDto] })
  @Type(() => ParentCategoryDto)
  parents: ParentCategoryDto[];

  @ApiProperty()
  level: number;

  @ApiProperty()
  isRoot: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  icon?: string;

  @ApiProperty({ required: false })
  color?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}