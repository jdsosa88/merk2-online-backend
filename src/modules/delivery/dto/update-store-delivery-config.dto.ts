import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WeightSurchargeTierDto } from './update-platform-delivery-config.dto';
import { MoneyUtils } from 'src/common/utils/money.utils';

export class StoreZonePriceDto {
  @ApiPropertyOptional({ description: 'Id de la zona de entrega' })
  @IsMongoId()
  zoneId: string;

  @ApiPropertyOptional({ example: 150, description: 'Precio de mensajería a esa zona' })
  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdateStoreDeliveryConfigDto {
  @ApiPropertyOptional({ type: [StoreZonePriceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreZonePriceDto)
  zonePrices?: StoreZonePriceDto[];

  @ApiPropertyOptional({
    type: [WeightSurchargeTierDto],
    description: 'Vacío = usar valores por defecto de plataforma',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightSurchargeTierDto)
  weightSurchargeTiers?: WeightSurchargeTierDto[];

  static toCents(dto: UpdateStoreDeliveryConfigDto) {
    return {
      ...(dto.zonePrices !== undefined && {
        zonePrices: dto.zonePrices.map((zp) => ({
          zoneId: zp.zoneId,
          priceCents: MoneyUtils.decimalToCents(zp.price),
        })),
      }),
      ...(dto.weightSurchargeTiers !== undefined && {
        weightSurchargeTiers: dto.weightSurchargeTiers.map((tier) => ({
          minWeight: tier.minWeight,
          maxWeight: tier.maxWeight,
          surchargeCents: MoneyUtils.decimalToCents(tier.surcharge),
        })),
      }),
    };
  }
}
