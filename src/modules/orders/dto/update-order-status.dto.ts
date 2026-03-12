import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { OrderStatus } from '../types/orders.type';


export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'New status for the order',
    example: OrderStatus.IN_PREPARATION
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiPropertyOptional({
    description: 'Reason for cancellation or abortion',
    example: 'Customer requested cancellation',
    minLength: 5,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Estimated delivery time',
    example: '2024-12-31T18:00:00.000Z'
  })
  @IsOptional()
  estimatedDeliveryTime?: Date;

  @ApiPropertyOptional({
    description: 'Tracking number for delivery',
    example: 'TRK123456789'
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({
    description: 'Delivery address',
    example: '123 Main St, City, Country'
  })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;
}