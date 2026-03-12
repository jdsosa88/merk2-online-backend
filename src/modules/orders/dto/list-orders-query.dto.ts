import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBooleanString } from 'class-validator';
import { PaginationListParamsDto } from 'src/common/dto/pagination-list-params.dto';
import { OrderStatus } from '../types/orders.type';


export class ListOrdersQueryDto extends PaginationListParamsDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    example: `${OrderStatus.REQUESTED},${OrderStatus.IN_PREPARATION}`,
    description: 'Comma-separated list of order statuses to filter'
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Business ID to filter orders',
    example: '60d5f9f8f8b7a12c3c4d5e6f'
  })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({
    description: 'Customer ID to filter orders',
    example: '60d5f9f8f8b7a12c3c4d5e6f'
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by assigned messenger ID',
    example: '60d5f9f8f8b7a12c3c4d5e6f'
  })
  @IsOptional()
  @IsString()
  messengerId?: string;

  @ApiPropertyOptional({
    description: 'Search by tracking number or order notes',
    example: 'TRK123'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Start date for order creation (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for order creation (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter orders with pending charges',
    example: 'true'
  })
  @IsOptional()
  @IsBooleanString()
  hasPendingCharges?: string;
}