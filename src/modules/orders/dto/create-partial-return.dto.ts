import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PartialReturnItemDto {
  @ApiProperty({ description: 'Product id of the order line to return' })
  @IsMongoId()
  productId: string;

  @ApiProperty({ description: 'Quantity to return (reduce) from that line', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePartialReturnDto {
  @ApiProperty({ type: [PartialReturnItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PartialReturnItemDto)
  items: PartialReturnItemDto[];

  @ApiProperty({ example: 'Cliente rechazó producto dañado' })
  @IsString()
  @MaxLength(120)
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Offline sync idempotency key' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientLocalId?: string;
}
