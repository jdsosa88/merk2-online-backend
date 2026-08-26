import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerApplication, SellerApplicationSchema } from './schemas/seller-application.schema';
import { SellerApplicationsService } from './seller-applications.service';
import {
  AdminSellerApplicationsController,
  SellerApplicationsController,
} from './seller-applications.controller';
import { UsersModule } from '../users/users.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SellerApplication.name, schema: SellerApplicationSchema },
    ]),
    forwardRef(() => UsersModule),
    CaslModule,
  ],
  controllers: [SellerApplicationsController, AdminSellerApplicationsController],
  providers: [SellerApplicationsService],
  exports: [SellerApplicationsService],
})
export class SellerApplicationsModule {}
