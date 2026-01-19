import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { 
  ApiGetHealthStatus, 
  ApiGetHealthPing
} from './decorators/swagger-health.decorator';
import { HealthService } from './health.service';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { HealthStatus } from './types/health-status.interface';
import { AppConfigService } from './app-config.service';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly healthService: HealthService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Get('status')
  @UseGuards(ApiKeyGuard)
  @ApiGetHealthStatus()
  async getStatus(): Promise<HealthStatus> {
    const appStatus = this.configService.get<string>('app.status');
    const appName = this.configService.get<string>('app.name');
    const apiVersion = this.configService.get<string>('app.apiVersion');
    const appEnv = this.configService.get<string>('app.env');    
    const dbConnected = await this.healthService.checkDatabase();
    const appConfig = await this.appConfigService.findOne();
    
    return {
      status: appStatus as any,
      timestamp: new Date().toISOString(),
      service: appName as any,
      apiVersion: apiVersion  as any,
      environment: appEnv  as any,
      uptime: process.uptime(),
      dependencies: {
        database: dbConnected
      },
      appConfig: {       
        android: appConfig.android,
        ios: appConfig.ios,       
      },
    };
  }
  
  @Get('ping')
  @UseGuards(ApiKeyGuard)
  @ApiGetHealthPing()
  async ping(): Promise<ApiResponseDto> {
    return new ApiResponseDto('success');
  }  
}