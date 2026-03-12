import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNumber, Min, ValidateNested, ArrayMinSize, IsNotEmpty } from 'class-validator';

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
}

export class CheckoutOrderDto {
  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Array of products to order',
    example: [
      { productId: '60d5f9f8f8b7a12c3c4d5e6f', quantity: 2 },
      { productId: '60d5f9f8f8b7a12c3c4d5e70', quantity: 1 }
    ]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  @IsNotEmpty()
  items: CheckoutItemDto[];
}