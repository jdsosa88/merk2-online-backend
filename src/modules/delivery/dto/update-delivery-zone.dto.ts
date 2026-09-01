import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDeliveryZoneDto } from './create-delivery-zone.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MoneyUtils } from 'src/common/utils/money.utils';

export class UpdateDeliveryZoneDto extends PartialType(
  OmitType(CreateDeliveryZoneDto, ['province', 'municipality'] as const),
) {
  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPrice?: number;

  static toCents(dto: UpdateDeliveryZoneDto): Record<string, unknown> {
    const result: Record<string, unknown> = { ...dto };
    if (dto.defaultPrice !== undefined) {
      result.defaultPriceCents = MoneyUtils.decimalToCents(dto.defaultPrice);
      delete result.defaultPrice;
    }
    if (dto.name !== undefined) {
      result.name = dto.name.trim();
    }
    return result;
  }
}
