import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CheckoutItemDto } from './checkout-order.dto';

export class PosSaleDto {
  @ApiProperty({
    description: 'Store where the sale / phone order is registered',
    example: '60d5f9f8f8b7a12c3c4d5e6f',
  })
  @IsMongoId()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Products in the POS cart',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiPropertyOptional({
    description: 'When true, order includes delivery (phone order) and requires zone + contact',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDelivery?: boolean;

  @ApiPropertyOptional({
    description: 'Delivery zone id (required when includeDelivery)',
    example: '60d5f9f8f8b7a12c3c4d5e6f',
  })
  @ValidateIf((o) => o.includeDelivery === true)
  @IsMongoId()
  @IsNotEmpty()
  deliveryZoneId?: string;

  @ApiPropertyOptional({
    description: 'Customer name (required when includeDelivery)',
    example: 'María Pérez',
    maxLength: 120,
  })
  @ValidateIf((o) => o.includeDelivery === true)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone (required when includeDelivery)',
    example: '+53 5 1234567',
    maxLength: 30,
  })
  @ValidateIf((o) => o.includeDelivery === true)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Exact delivery address (required when includeDelivery)',
    example: 'Calle 1 #23 e/ A y B',
    maxLength: 250,
  })
  @ValidateIf((o) => o.includeDelivery === true)
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  customerAddress?: string;

  @ApiPropertyOptional({
    description: 'Optional notes',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
