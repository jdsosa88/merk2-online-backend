import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryZone, DeliveryZoneSchema } from './schemas/delivery-zone.schema';
import {
  PlatformDeliveryConfig,
  PlatformDeliveryConfigSchema,
} from './schemas/platform-delivery-config.schema';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { AdminDeliveryController } from './admin-delivery.controller';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryZone.name, schema: DeliveryZoneSchema },
      { name: PlatformDeliveryConfig.name, schema: PlatformDeliveryConfigSchema },
    ]),
    CaslModule,
  ],
  controllers: [DeliveryController, AdminDeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
