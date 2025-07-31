import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';
import { MailerModule } from '@nestjs-modules/mailer';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: `mongodb://${config.get('MONGO_INITDB_ROOT_USERNAME')}:${config.get('MONGO_INITDB_ROOT_PASSWORD')}@localhost:27017/${config.get('MONGO_DB_NAME')}?authSource=admin`,
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAILER_HOST'),
          port: config.get<number>('MAILER_PORT'),
          auth: {
            user: config.get('MAILER_AUTH_USER'),
            pass: config.get('MAILER_AUTH_PASS'),
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
  ],
})
export class AppModule { }
