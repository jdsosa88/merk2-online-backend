import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { PendingCharge, PendingChargeSchema } from './schemas/pending-charge.schema';
import { CaslModule } from '../casl/casl.module';
import { StoresModule } from '../stores/stores.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { MessengerInDelivery, MessengerInDeliverySchema } from './schemas/messengers-in-delivery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: PendingCharge.name, schema: PendingChargeSchema },
      { name: MessengerInDelivery.name, schema: MessengerInDeliverySchema },
    ]),
    CaslModule,
    forwardRef(() => StoresModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
