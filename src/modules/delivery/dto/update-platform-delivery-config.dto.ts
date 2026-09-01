import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MoneyUtils } from 'src/common/utils/money.utils';

export class WeightSurchargeTierDto {
  @ApiProperty({ example: 0.1 })
  @IsNumber()
  @Min(0)
  minWeight: number;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0)
  maxWeight: number;

  @ApiProperty({ example: 0, description: 'Recargo en moneda decimal (0 = solo precio de zona)' })
  @IsNumber()
  @Min(0)
  surcharge: number;
}

export class UpdatePlatformDeliveryConfigDto {
  @ApiProperty({ type: [WeightSurchargeTierDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WeightSurchargeTierDto)
  weightSurchargeTiers: WeightSurchargeTierDto[];

  static toCents(dto: UpdatePlatformDeliveryConfigDto) {
    return {
      weightSurchargeTiers: dto.weightSurchargeTiers.map((tier) => ({
        minWeight: tier.minWeight,
        maxWeight: tier.maxWeight,
        surchargeCents: MoneyUtils.decimalToCents(tier.surcharge),
      })),
    };
  }
}
