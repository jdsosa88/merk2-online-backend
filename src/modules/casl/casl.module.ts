import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/user.schema';

@Module({
  providers: [CaslAbilityFactory],  
  exports: [CaslAbilityFactory],
})

export class CaslModule { }
