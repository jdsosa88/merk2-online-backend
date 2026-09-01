import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListDeliveryZonesQueryDto {
  @ApiPropertyOptional({ example: 'Granma' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  province?: string;

  @ApiPropertyOptional({ example: 'Manzanillo' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  municipality?: string;
}
