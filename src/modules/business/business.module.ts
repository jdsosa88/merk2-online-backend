import { forwardRef, Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CaslModule } from '../casl/casl.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { Business, BusinessSchema } from './schemas/business.schema';
import { AdminBusinessController } from './admin-business.controller';
import { EmploymentRequest, EmploymentRequestSchema } from './schemas/employment-request.schema';
import { EmployeeService } from './employee.service';
import { EmploymentRequestService } from './employment-request.service';
import { CategoriesModule } from '../categories/categories.module';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
      { name: EmploymentRequest.name, schema: EmploymentRequestSchema },
    ]),
    CaslModule,
    forwardRef(() => UsersModule),
    forwardRef(() => CategoriesModule),
    forwardRef(() => ProductsModule),
    ImagesModule,
  ],
  controllers: [BusinessController, AdminBusinessController],
  providers: [BusinessService, EmployeeService, EmploymentRequestService],
  exports: [BusinessService],
})
export class BusinessModule { }
