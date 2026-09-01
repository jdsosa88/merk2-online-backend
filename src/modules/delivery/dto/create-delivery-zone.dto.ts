import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoneyUtils } from 'src/common/utils/money.utils';

export class CreateDeliveryZoneDto {
  @ApiProperty({ example: 'Granma' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  province: string;

  @ApiProperty({ example: 'Manzanillo' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  municipality: string;

  @ApiProperty({ example: 'Centro del pueblo' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 150, description: 'Precio base de mensajería en moneda decimal' })
  @IsNumber()
  @Min(0)
  defaultPrice: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  static toCents(dto: CreateDeliveryZoneDto): {
    province: string;
    municipality: string;
    name: string;
    defaultPriceCents: number;
    isActive?: boolean;
    sortOrder?: number;
  } {
    return {
      province: dto.province.trim(),
      municipality: dto.municipality.trim(),
      name: dto.name.trim(),
      defaultPriceCents: MoneyUtils.decimalToCents(dto.defaultPrice),
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    };
  }
}
