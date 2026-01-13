import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { AppConfigController } from './app-config.controller';
import { HealthService } from './health.service';
import { AppConfigService } from './app-config.service';
import { AppConfig, AppConfigSchema } from './schemas/app-config.schema';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppConfig.name, schema: AppConfigSchema },
    ]),
    CaslModule,
  ],
  controllers: [HealthController, AppConfigController],
  providers: [HealthService, AppConfigService],
})
export class HealthModule {}