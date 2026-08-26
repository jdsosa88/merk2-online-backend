import { Module, forwardRef } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { UsersModule } from '../users/users.module';
import { StoresModule } from '../stores/stores.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => StoresModule),
    CaslModule,
  ],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
