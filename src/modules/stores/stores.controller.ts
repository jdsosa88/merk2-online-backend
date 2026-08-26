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
  CreateStorePolicy,
  ManageStoreMessengersPolicy,
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
}
