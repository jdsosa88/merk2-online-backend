import {
  Body,
  Controller,
  Delete,
  Get,
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
import { IdDto } from 'src/common/dto/id.dto';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { UpdatePlatformDeliveryConfigDto } from './dto/update-platform-delivery-config.dto';
import {
  ManageDeliveryZonePolicy,
  ManagePlatformDeliveryConfigPolicy,
} from './policies/delivery.policies';

@ApiTags('Admin Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/delivery')
export class AdminDeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('zones')
  @CheckPolicies(new ManageDeliveryZonePolicy())
  @ApiOperation({ summary: 'Listar todas las zonas (admin)' })
  async listZones(): Promise<ApiResponseDto> {
    const zones = await this.deliveryService.listAllZones(true);
    return new ApiResponseDto('Delivery zones retrieved', zones);
  }

  @Post('zones')
  @CheckPolicies(new ManageDeliveryZonePolicy())
  @ApiOperation({ summary: 'Crear zona de entrega' })
  async createZone(@Body() dto: CreateDeliveryZoneDto): Promise<ApiResponseDto> {
    const zone = await this.deliveryService.createZone(dto);
    return new ApiResponseDto('Delivery zone created', zone);
  }

  @Patch('zones')
  @CheckPolicies(new ManageDeliveryZonePolicy())
  @ApiOperation({ summary: 'Actualizar zona de entrega' })
  async updateZone(
    @Query() idDto: IdDto,
    @Body() dto: UpdateDeliveryZoneDto,
  ): Promise<ApiResponseDto> {
    const zone = await this.deliveryService.updateZone(idDto.id, dto);
    return new ApiResponseDto('Delivery zone updated', zone);
  }

  @Delete('zones')
  @CheckPolicies(new ManageDeliveryZonePolicy())
  @ApiOperation({ summary: 'Desactivar zona de entrega' })
  async removeZone(@Query() idDto: IdDto): Promise<ApiResponseDto> {
    const zone = await this.deliveryService.removeZone(idDto.id);
    return new ApiResponseDto('Delivery zone deactivated', zone);
  }

  @Get('platform-config')
  @CheckPolicies(new ManagePlatformDeliveryConfigPolicy())
  @ApiOperation({ summary: 'Obtener configuración global de recargos por peso' })
  async getPlatformConfig(): Promise<ApiResponseDto> {
    const config = await this.deliveryService.getPlatformConfig();
    return new ApiResponseDto('Platform delivery config retrieved', config);
  }

  @Patch('platform-config')
  @CheckPolicies(new ManagePlatformDeliveryConfigPolicy())
  @ApiOperation({ summary: 'Actualizar recargos por peso influenciador (defaults)' })
  async updatePlatformConfig(
    @Body() dto: UpdatePlatformDeliveryConfigDto,
  ): Promise<ApiResponseDto> {
    const config = await this.deliveryService.updatePlatformConfig(dto);
    return new ApiResponseDto('Platform delivery config updated', config);
  }
}
