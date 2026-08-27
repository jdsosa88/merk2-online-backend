import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from './schemas/store.schema';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { UsersModule } from '../users/users.module';
import { CaslModule } from '../casl/casl.module';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    forwardRef(() => UsersModule),
    CaslModule,
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
