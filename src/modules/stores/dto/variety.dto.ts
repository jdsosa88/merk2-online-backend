import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MoneyUtils } from 'src/common/utils/money.utils';

export class CreateStoreVarietyTypeDto {
  @ApiProperty({ example: 'Flavor', minLength: 1, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Customer must pick an option when customizing' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateStoreVarietyTypeDto extends PartialType(CreateStoreVarietyTypeDto) {}

export class CreateStoreVarietyOptionDto {
  @ApiProperty({ example: 'Chocolate', minLength: 1, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  label: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Extra amount in decimal currency added to product base price (e.g. 5.00)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceDelta?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Pre-selected for customers on product detail (only one default per variety type)',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  static toCents(dto: CreateStoreVarietyOptionDto): CreateStoreVarietyOptionDto {
    return {
      ...dto,
      priceDelta: MoneyUtils.decimalToCents(dto.priceDelta ?? 0),
    };
  }
}

export class UpdateStoreVarietyOptionDto extends PartialType(CreateStoreVarietyOptionDto) {
  static toCents(dto: UpdateStoreVarietyOptionDto): UpdateStoreVarietyOptionDto {
    const next = { ...dto };
    if (dto.priceDelta !== undefined) {
      next.priceDelta = MoneyUtils.decimalToCents(dto.priceDelta);
    }
    return next;
  }
}
