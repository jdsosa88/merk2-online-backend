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

@ApiTags('Health - App Config')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('health/app-config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Post()
  @ApiCreateAppConfig()
  @CheckPolicies(new ManageAppConfigPolicy())
  async create(@Body() createAppConfigDto: CreateAppConfigDto): Promise<AppConfig> {
    return this.appConfigService.create(createAppConfigDto);
  }

  @Get()
  @ApiGetAppConfig()
  @CheckPolicies(new ManageAppConfigPolicy())
  async findOne(): Promise<AppConfig> {
    return this.appConfigService.findOne();
  }

  @Patch()
  @ApiUpdateAppConfig()
  @CheckPolicies(new ManageAppConfigPolicy())
  async update(@Body() updateAppConfigDto: UpdateAppConfigDto): Promise<AppConfig> {
    return this.appConfigService.update(updateAppConfigDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteAppConfig()
  @CheckPolicies(new ManageAppConfigPolicy())
  async remove(): Promise<void> {
    await this.appConfigService.remove();
  }
}