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
    UsersModule,
    AuthModule,
    VerificationCodeModule,
    CaslModule,
    BusinessModule,
    CategoriesModule,
    HealthModule,
  ],
})
export class AppModule { }