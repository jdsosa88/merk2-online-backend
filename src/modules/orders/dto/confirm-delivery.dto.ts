import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmDeliveryDto {
  @ApiProperty({
    description: 'Delivery code from the customer QR (or full QR payload string)',
    example: 'a1b2c3d4e5f6789012345678abcdef01',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  deliveryCode: string;

  @ApiPropertyOptional({ description: 'Offline sync idempotency key' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientLocalId?: string;
}
