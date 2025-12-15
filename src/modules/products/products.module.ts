import { forwardRef, Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { CaslModule } from '../casl/casl.module';
import { UsersModule } from '../users/users.module';
import { BusinessModule } from '../business/business.module';
import { ProductsService } from './products.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CaslModule,
    //UsersModule,
    //forwardRef(() => BusinessModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],

})
export class ProductsModule { }
