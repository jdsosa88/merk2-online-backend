import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CaslModule } from './modules/casl/casl.module';
import { BusinessModule } from './modules/business/business.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: `${config.get('MONGO_URI')}`,
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAILER_HOST'),
          port: config.get<number>('MAILER_PORT'),
          secure: config.get<boolean>('MAILER_SECURE') === true, // true -> 465, false -> 587
          auth: {
            user: config.get<string>('MAILER_AUTH_USER'),
            pass: config.get<string>('MAILER_AUTH_PASS'),
          },
        },
        defaults: {
          from: `"${config.get('MAILER_EMAIL_FROM_NAME')}" <${config.get('MAILER_EMAIL_FROM_DOMAIN')}>`,
        },
      }),
    }),
    UsersModule,
    AuthModule,
    VerificationCodeModule,
    CaslModule,
    forwardRef(() => BusinessModule),
})
export class AppModule { }
