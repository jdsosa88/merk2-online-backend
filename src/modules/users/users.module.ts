import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { VerificationCodeModule } from '../verification-code/verification-code.module';
import { CaslModule } from 'src/modules/casl/casl.module';
import { AdminUsersController } from './admin-users.controller';
import { Provider, ProviderSchema } from './schemas/provider.schema';
import { UserFactory } from './user.factory';
import { Manager, ManagerSchema } from './schemas/manager.schema';
import { Messenger, MessengerSchema } from './schemas/messenger.schema';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
        discriminators: [
          {
            name: Provider.name,
            schema: ProviderSchema,
          },
          {
            name: Manager.name,
            schema: ManagerSchema,
          },
          {
            name: Messenger.name,
            schema: MessengerSchema,
          },
        ]
      }]),
    CaslModule,
    VerificationCodeModule,
    forwardRef(() => BusinessModule)
  ],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, UserFactory],
  exports: [UsersService],
})
export class UsersModule { }
