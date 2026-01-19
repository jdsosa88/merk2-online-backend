import { Body, Controller, Get, Post, Patch, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppConfigService } from './app-config.service';
import { CreateAppConfigDto } from './dto/create-app-config.dto';
import { UpdateAppConfigDto } from './dto/update-app-config.dto';
import { AppConfig } from './schemas/app-config.schema';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from '../casl/decorators/policies.decorator';
import { ManageAppConfigPolicy } from './policies/manage-app-config.policy';
import {
  ApiCreateAppConfig,
  ApiGetAppConfig,
  ApiUpdateAppConfig,
  ApiDeleteAppConfig
} from './decorators/swagger-health.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';

@ApiTags('Health - App Config')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('health/app-config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Post()
  @ApiCreateAppConfig()
  @CheckPolicies(new ManageAppConfigPolicy())
  async create(@Body() createAppConfigDto: CreateAppConfigDto): Promise<ApiResponseDto<AppConfig>> {
    const appConfig = await this.appConfigService.create(createAppConfigDto);
    return new ApiResponseDto('App configuration created successfully', appConfig);
  }

  @Get()
  @ApiGetAppConfig()
  @CheckPolicies(new ManageAppConfigPolicy())
  async findOne(): Promise<ApiResponseDto<AppConfig>> {
    const appConfig = await this.appConfigService.findOne();
    return new ApiResponseDto('App configuration retrieved successfully', appConfig);
  }

  @Patch()
  @ApiUpdateAppConfig()
  @CheckPolicies(new ManageAppConfigPolicy())
  async update(@Body() updateAppConfigDto: UpdateAppConfigDto): Promise<ApiResponseDto<AppConfig>> {
    const appConfig = await this.appConfigService.update(updateAppConfigDto);
    return new ApiResponseDto('App configuration updated successfully', appConfig);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiDeleteAppConfig()
  @CheckPolicies(new ManageAppConfigPolicy())
  async remove(): Promise<ApiResponseDto> {
    await this.appConfigService.remove();
    return new ApiResponseDto('App configuration deleted successfully');
  }
}