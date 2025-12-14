import { forwardRef, Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CaslModule } from '../casl/casl.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { Business, BusinessSchema } from './schemas/business.schema';
import { AdminBusinessController } from './admin-business.controller';

@Module({
  imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]),
        CaslModule,
        forwardRef(() => UsersModule),             
        //forwardRef(() => ProductsModule),             
      ],
  controllers: [BusinessController, AdminBusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
