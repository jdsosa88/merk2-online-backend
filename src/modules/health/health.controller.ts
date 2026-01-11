import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthStatus } from './types/health-status.interface';
import { 
  ApiGetHealthStatus, 
  ApiGetHealthPing
} from './decorators/swagger-health.decorator';
import { HealthService } from './health.service';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly healthService: HealthService,
  ) {}

  @Get('status')
  @ApiGetHealthStatus()
  async getStatus(): Promise<HealthStatus> {
    const appStatus = this.configService.get<string>('app.status');
    const appName = this.configService.get<string>('app.name');
    const appVersion = this.configService.get<string>('app.version');
    const appEnv = this.configService.get<string>('app.env');    
    const dbConnected = await this.healthService.checkDatabase();
    
    return {
      status: appStatus as any,
      timestamp: new Date().toISOString(),
      service: appName as any,
      version: appVersion as any,
      environment: appEnv as any,
      uptime: process.uptime(),
      dependencies: {
        database: dbConnected
      }
    };
  }
  
  @Get('ping')
  @ApiGetHealthPing()
  async ping() {
    return {
      message: 'success',
      timestamp: new Date().toISOString()
    };
  }  
}