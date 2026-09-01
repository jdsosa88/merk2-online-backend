import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { StoresService } from './stores.service';
import {
  AssignMessengerDto,
  CreateStoreDto,
  UpdateStoreDto,
  UpdateStoreStatusDto,
} from './dto/store.dto';
import {
  CreateStoreVarietyOptionDto,
  CreateStoreVarietyTypeDto,
  UpdateStoreVarietyOptionDto,
  UpdateStoreVarietyTypeDto,
} from './dto/variety.dto';
import { UpdateStoreDeliveryConfigDto } from '../delivery/dto/update-store-delivery-config.dto';
import {
  CreateStorePolicy,
  ManageStoreMessengersPolicy,
  ManageStoreDeliveryConfigPolicy,
  ReadStorePolicy,
  UpdateStorePolicy,
} from './policies/store.policies';

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @CheckPolicies(new CreateStorePolicy())
  @ApiOperation({ summary: 'Create a sales point / store (provider)' })
  async create(
    @AuthUser('id') userId: string,
    @Body() dto: CreateStoreDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.create(userId, dto);
    return new ApiResponseDto('Store created successfully', store);
  }

  @Get('mine')
  @CheckPolicies(new ReadStorePolicy())
  @ApiOperation({ summary: 'List my stores' })
  async findMine(@AuthUser('id') userId: string): Promise<ApiResponseDto> {
    const stores = await this.storesService.findMine(userId);
    return new ApiResponseDto('Stores retrieved', stores);
  }

  @Get('mine/stats')
  @CheckPolicies(new ReadStorePolicy())
  @ApiOperation({
    summary: 'Sales and catalog stats for all stores owned by the provider',
  })
  async findMineStats(@AuthUser('id') userId: string): Promise<ApiResponseDto> {
    const stats = await this.storesService.getMineStats(userId);
    return new ApiResponseDto('Store stats retrieved', stats);
  }

  @Get(':id')
  @CheckPolicies(new ReadStorePolicy())
  @ApiOperation({ summary: 'Get store by id' })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
    const store = await this.storesService.findById(id);
    return new ApiResponseDto('Store retrieved', store);
  }

  @Patch(':id')
  @CheckPolicies(new UpdateStorePolicy())
  @ApiOperation({ summary: 'Update store' })
  async update(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @Body() dto: UpdateStoreDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.update(id, userId, dto);
    return new ApiResponseDto('Store updated', store);
  }

  @Patch(':id/status')
  @CheckPolicies(new UpdateStorePolicy())
  @ApiOperation({ summary: 'Update store status (active/disabled)' })
  async updateStatus(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @Body() dto: UpdateStoreStatusDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.updateStatus(id, userId, dto);
    return new ApiResponseDto('Store status updated', store);
  }

  @Get(':id/messengers')
  @CheckPolicies(new ManageStoreMessengersPolicy())
  @ApiOperation({ summary: 'List assigned and available messengers for a store' })
  async listMessengers(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto> {
    const panel = await this.storesService.listStoreMessengerPanel(id, userId);
    return new ApiResponseDto('Store messengers retrieved', panel);
  }

  @Post(':id/messengers')
  @CheckPolicies(new ManageStoreMessengersPolicy())
  @ApiOperation({ summary: 'Assign messenger to store' })
  async assignMessenger(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @Body() dto: AssignMessengerDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.assignMessenger(id, userId, dto);
    return new ApiResponseDto('Messenger assigned to store', store);
  }

  @Post(':id/messengers/self')
  @CheckPolicies(new ManageStoreMessengersPolicy())
  @ApiOperation({ summary: 'Provider self-assigns as messenger to store' })
  async assignSelf(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.assignSelfAsMessenger(id, userId);
    return new ApiResponseDto('Provider assigned as messenger to store', store);
  }

  @Delete(':id/messengers/:messengerId')
  @CheckPolicies(new ManageStoreMessengersPolicy())
  @ApiOperation({ summary: 'Remove messenger from store' })
  async removeMessenger(
    @Param('id') id: string,
    @Param('messengerId') messengerId: string,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.removeMessenger(id, userId, messengerId);
    return new ApiResponseDto('Messenger removed from store', store);
  }

  @Get(':id/variety-types')
  @CheckPolicies(new ReadStorePolicy())
  @ApiOperation({ summary: 'List store variety types (flavor, filling, etc.)' })
  async listVarietyTypes(@Param('id') id: string): Promise<ApiResponseDto> {
    const types = await this.storesService.listVarietyTypes(id);
    return new ApiResponseDto('Variety types retrieved', types);
  }

  @Post(':id/variety-types')
  @CheckPolicies(new UpdateStorePolicy())
  @ApiOperation({ summary: 'Create a custom variety type for the store' })
  async createVarietyType(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @Body() dto: CreateStoreVarietyTypeDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.createVarietyType(id, userId, dto);
    return new ApiResponseDto('Variety type created', store);
  }

  @Patch(':id/variety-types/:typeId')
  @CheckPolicies(new UpdateStorePolicy())
  @ApiOperation({ summary: 'Update a store variety type' })
  async updateVarietyType(
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @AuthUser('id') userId: string,
    @Body() dto: UpdateStoreVarietyTypeDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.updateVarietyType(id, userId, typeId, dto);
    return new ApiResponseDto('Variety type updated', store);
  }

  @Delete(':id/variety-types/:typeId')
  @CheckPolicies(new UpdateStorePolicy())
  @ApiOperation({ summary: 'Delete a store variety type' })
  async removeVarietyType(
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.removeVarietyType(id, userId, typeId);
    return new ApiResponseDto('Variety type deleted', store);
  }

  @Post(':id/variety-types/:typeId/options')
  @CheckPolicies(new UpdateStorePolicy())
  @ApiOperation({ summary: 'Add an option to a store variety type' })
  async createVarietyOption(
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @AuthUser('id') userId: string,
    @Body() dto: CreateStoreVarietyOptionDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.createVarietyOption(id, userId, typeId, dto);
    return new ApiResponseDto('Variety option created', store);
  }

  @Patch(':id/variety-types/:typeId/options/:optionId')
  @CheckPolicies(new UpdateStorePolicy())
  @ApiOperation({ summary: 'Update a store variety option (label, priceDelta, etc.)' })
  async updateVarietyOption(
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @Param('optionId') optionId: string,
    @AuthUser('id') userId: string,
    @Body() dto: UpdateStoreVarietyOptionDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.updateVarietyOption(
      id,
      userId,
      typeId,
      optionId,
      dto,
    );
    return new ApiResponseDto('Variety option updated', store);
  }

  @Delete(':id/variety-types/:typeId/options/:optionId')
  @CheckPolicies(new UpdateStorePolicy())
  @ApiOperation({ summary: 'Delete a store variety option' })
  async removeVarietyOption(
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @Param('optionId') optionId: string,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.removeVarietyOption(
      id,
      userId,
      typeId,
      optionId,
    );
    return new ApiResponseDto('Variety option deleted', store);
  }

  @Get(':id/delivery-config')
  @CheckPolicies(new ManageStoreDeliveryConfigPolicy())
  @ApiOperation({ summary: 'Configuración de mensajería de la tienda (zonas y recargos por peso)' })
  async getDeliveryConfig(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto> {
    const config = await this.storesService.getStoreDeliveryConfig(id, userId);
    return new ApiResponseDto('Store delivery config retrieved', config);
  }

  @Patch(':id/delivery-config')
  @CheckPolicies(new ManageStoreDeliveryConfigPolicy())
  @ApiOperation({ summary: 'Actualizar precios de mensajería por zona y recargos por peso' })
  async updateDeliveryConfig(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @Body() dto: UpdateStoreDeliveryConfigDto,
  ): Promise<ApiResponseDto> {
    const store = await this.storesService.updateStoreDeliveryConfig(id, userId, dto);
    return new ApiResponseDto('Store delivery config updated', store);
  }
}
