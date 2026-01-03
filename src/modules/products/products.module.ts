import { forwardRef, Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { CaslModule } from '../casl/casl.module';

import { BusinessModule } from '../business/business.module';
import { ProductsService } from './products.service';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CaslModule,
    forwardRef(() => UsersModule),
    forwardRef(() => BusinessModule),
    forwardRef(() => CategoriesModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],

})
export class ProductsModule { }
