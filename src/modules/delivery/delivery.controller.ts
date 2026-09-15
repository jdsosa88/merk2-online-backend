import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { DeliveryService } from './delivery.service';
import { ListDeliveryZonesQueryDto } from './dto/list-zones-query.dto';
import { ReadDeliveryZonePolicy } from './policies/delivery.policies';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('zones')
  @CheckPolicies(new ReadDeliveryZonePolicy())
  @ApiOperation({ summary: 'Listar zonas de entrega activas (ej. Manzanillo)' })
  async listZones(
    @Query() query: ListDeliveryZonesQueryDto,
  ): Promise<ApiResponseDto> {
    const zones = await this.deliveryService.listZones(query);
    return new ApiResponseDto('Delivery zones retrieved', zones);
  }

  @Get('sales-regions')
  @CheckPolicies(new ReadDeliveryZonePolicy())
  @ApiOperation({
    summary: 'Provincias/municipios con zonas activas (selector del vendedor)',
  })
  async listSalesRegions(): Promise<ApiResponseDto> {
    const regions = await this.deliveryService.listSalesRegions();
    return new ApiResponseDto('Sales regions retrieved', regions);
  }

  @Get('zones/:id')
  @CheckPolicies(new ReadDeliveryZonePolicy())
  @ApiOperation({ summary: 'Obtener zona de entrega por id' })
  async findZone(@Param('id') id: string): Promise<ApiResponseDto> {
    const zone = await this.deliveryService.findZoneById(id);
    return new ApiResponseDto('Delivery zone retrieved', zone);
  }
}
