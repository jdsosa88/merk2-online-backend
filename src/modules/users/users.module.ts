import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { VerificationCodeModule } from '../verification-code/verification-code.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    VerificationCodeModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
