import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CaslModule } from './modules/casl/casl.module';
import { BusinessModule } from './modules/business/business.module';
import { CategoriesModule } from './modules/categories/categories.module';
import configuration from './config/configuration';
import { envValidationSchema } from './config/schemas/env.schema';
import { HealthModule } from './modules/health/health.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ImagesModule } from './modules/images/images.module';
import { SellerApplicationsModule } from './modules/seller-applications/seller-applications.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { TeamModule } from './modules/team/team.module';
import { DeliveryModule } from './modules/delivery/delivery.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `src/config/envs/.env.${process.env.NODE_ENV || 'development'}`,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
      isGlobal: true,
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: config.get('mailer.transport'),
        defaults: config.get('mailer.defaults'),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    AuthModule,
    VerificationCodeModule,
    CaslModule,
    BusinessModule,
    SellerApplicationsModule,
    StoresModule,
    ProductsModule,
    TeamModule,
    DeliveryModule,
    CategoriesModule,
    OrdersModule,
    HealthModule,
    ImagesModule,
  ],
})
export class AppModule { }