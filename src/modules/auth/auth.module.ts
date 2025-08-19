import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshToken, RefreshTokenSchema } from './refresh-token/refresh-token.schema';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { VerificationCodeModule } from '../verification-code/verification-code.module';
import { CaslModule } from 'src/modules/casl/casl.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRATION') },
      }),
    }),
    CaslModule,
    UsersModule,
    VerificationCodeModule,
  ],
  providers: [AuthService, RefreshTokenService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule { }
