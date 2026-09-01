import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsString,
} from 'class-validator';

export class CheckoutSelectedOptionDto {
  @ApiProperty({
    description: 'Variety type id. Use "visual" for product visual gallery options.',
    example: 'visual',
  })
  @IsString()
  @IsNotEmpty()
  varietyTypeId: string;

  @ApiProperty({
    description: 'Selected option id within that variety type',
    example: '60d5f9f8f8b7a12c3c4d5e6f',
  })
  @IsString()
  @IsNotEmpty()
  optionId: string;
}

export class CheckoutSelectedAddonDto {
  @ApiProperty({
    description: 'Addon product id from the plate composition',
    example: '60d5f9f8f8b7a12c3c4d5e6f',
  })
  @IsMongoId()
  @IsNotEmpty()
  addonId: string;

  @ApiProperty({
    description: 'Quantity for this addon (min 1 = plate base portion)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CheckoutItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: '60d5f9f8f8b7a12c3c4d5e6f'
  })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({
    type: [CheckoutSelectedOptionDto],
    description:
      'Personalized variety selections. Omit or pass [] for baker\'s choice (base price only).',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutSelectedOptionDto)
  selectedOptions?: CheckoutSelectedOptionDto[];

  @ApiPropertyOptional({
    type: [CheckoutSelectedAddonDto],
    description:
      'Plate composition addon quantities. Each composition addon must be qty >= 1; released addons may be higher.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutSelectedAddonDto)
  selectedAddons?: CheckoutSelectedAddonDto[];
}

export class CheckoutOrderDto {
  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Array of products to order',
    example: [
      { productId: '60d5f9f8f8b7a12c3c4d5e6f', quantity: 2 },
      {
        productId: '60d5f9f8f8b7a12c3c4d5e70',
        quantity: 1,
        selectedOptions: [
          { varietyTypeId: 'visual', optionId: '60d5f9f8f8b7a12c3c4d5e80' },
          { varietyTypeId: '60d5f9f8f8b7a12c3c4d5e81', optionId: '60d5f9f8f8b7a12c3c4d5e82' },
        ],
      },
    ]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  @IsNotEmpty()
  items: CheckoutItemDto[];

  @ApiPropertyOptional({
    description:
      'Fecha/hora de una reserva (ISO 8601). Solo si el cliente elige Reservar; no se exige solo por isReservable.',
    example: '2026-09-01T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
