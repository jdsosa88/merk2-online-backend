import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { MoneyUtils } from 'src/common/utils/money.utils';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['store'] as const)
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

  static toCents(dto: UpdateProductDto): UpdateProductDto {
    return {
      ...dto,
      ...(dto.price !== undefined && { price: MoneyUtils.decimalToCents(dto.price) }),
      ...(dto.discountValue !== undefined && {
        discountValue: MoneyUtils.decimalToCents(dto.discountValue),
      }),
      ...(dto.visualOptions !== undefined && {
        visualOptions: dto.visualOptions.map((option) => ({
          ...option,
          priceDelta: MoneyUtils.decimalToCents(option.priceDelta ?? 0),
        })),
      }),
    };
  }
}
