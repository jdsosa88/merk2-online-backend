import { forwardRef, Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { CaslModule } from '../casl/casl.module';

import { StoresModule } from '../stores/stores.module';
import { ProductsService } from './products.service';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { ProductMongoRepository } from './repositories/product.repository';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CaslModule,
    forwardRef(() => UsersModule),
    forwardRef(() => StoresModule),
    forwardRef(() => CategoriesModule),
    ImagesModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductMongoRepository,
    {
      provide: 'ProductRepository',
      useExisting: ProductMongoRepository,
    }
  ],
  exports: [ProductsService, 'ProductRepository'],

})
export class ProductsModule { }
