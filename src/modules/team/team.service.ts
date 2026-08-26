import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { StoresService } from '../stores/stores.service';
import { Role } from '../users/types/users.type';
import {
  AssignTeamMemberStoresDto,
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team.dto';
import { TeamRole } from './types/team.type';
import { CreateManagerDto, CreateMessengerDto } from '../users/dto/create-user.dto';
import { UpdateUserAllDto } from '../users/dto/update-user.dto';
import { Manager } from '../users/schemas/manager.schema';
import { Messenger } from '../users/schemas/messenger.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class TeamService {
  constructor(
    private readonly usersService: UsersService,
    private readonly storesService: StoresService,
  ) {}

  async listMine(providerId: string) {
    await this.assertProvider(providerId);
    return this.usersService.findByEmployer(providerId, [
      Role.MESSENGER,
      Role.MANAGER,
    ]);
  }

  async createMember(providerId: string, dto: CreateTeamMemberDto) {
    await this.assertProvider(providerId);

    if (dto.role === TeamRole.MESSENGER) {
      const createDto: CreateMessengerDto = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
        role: Role.MESSENGER,
        isPlatformMessenger: false,
        employer: new Types.ObjectId(providerId) as any,
        businesses: [],
        stores: [],
      };
      const user = await this.usersService.create(createDto, Role.MESSENGER);

      if (dto.storeIds?.length) {
        await this.syncMessengerStores(providerId, user._id.toString(), dto.storeIds);
      }
      return this.usersService.findOne(user._id.toString());
    }

    if (dto.role === TeamRole.MANAGER) {
      const createDto: CreateManagerDto = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
        role: Role.MANAGER,
        isMessenger: dto.isMessenger || false,
        employer: new Types.ObjectId(providerId) as any,
      };
      const user = await this.usersService.create(createDto, Role.MANAGER);
      return this.usersService.findOne(user._id.toString());
    }

    throw new BadRequestException('Unsupported team role');
  }

  async updateMember(
    providerId: string,
    memberId: string,
    dto: UpdateTeamMemberDto,
  ) {
    await this.assertProvider(providerId);
    const member = await this.getOwnedMember(providerId, memberId);

    if (dto.isMessenger !== undefined && member.role !== Role.MANAGER) {
      throw new BadRequestException('isMessenger only applies to managers');
    }

    if (
      dto.isMessenger === false &&
      member.role === Role.MANAGER &&
      (member as Manager).isMessenger
    ) {
      const manager = member as Manager;
      const storeIds = (manager.stores || []).map((id) => id.toString());
      for (const storeId of storeIds) {
        try {
          await this.storesService.removeMessenger(storeId, providerId, memberId);
        } catch {
          // already unlinked
        }
      }
    }

    const patch = {
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.password !== undefined ? { password: dto.password } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.isMessenger !== undefined ? { isMessenger: dto.isMessenger } : {}),
    } as UpdateUserAllDto;

    return this.usersService.saveUpdatedUser(memberId, patch);
  }

  async assignStores(
    providerId: string,
    memberId: string,
    dto: AssignTeamMemberStoresDto,
  ) {
    await this.assertProvider(providerId);
    const member = await this.getOwnedMember(providerId, memberId);

    if (!this.canAssignToStores(member)) {
      throw new BadRequestException(
        'Only messengers or managers with messenger duties enabled can be assigned to stores',
      );
    }

    await this.syncMessengerStores(providerId, memberId, dto.storeIds || []);
    return this.usersService.findOne(memberId);
  }

  async deleteMember(providerId: string, memberId: string) {
    await this.assertProvider(providerId);
    const member = await this.getOwnedMember(providerId, memberId);

    if (member.role === Role.MESSENGER) {
      const messenger = member as Messenger;
      const storeIds = (messenger.stores || []).map((id) => id.toString());
      for (const storeId of storeIds) {
        try {
          await this.storesService.removeMessenger(storeId, providerId, memberId);
        } catch {
          // already unlinked
        }
      }
    }

    if (member.role === Role.MANAGER && (member as Manager).isMessenger) {
      const manager = member as Manager;
      const storeIds = (manager.stores || []).map((id) => id.toString());
      for (const storeId of storeIds) {
        try {
          await this.storesService.removeMessenger(storeId, providerId, memberId);
        } catch {
          // already unlinked
        }
      }
    }

    return this.usersService.removeOtherUser(memberId);
  }

  private async syncMessengerStores(
    providerId: string,
    messengerId: string,
    desiredStoreIds: string[],
  ) {
    const myStores = await this.storesService.findMine(providerId);
    const myStoreIds = new Set(myStores.map((s) => s._id.toString()));

    for (const storeId of desiredStoreIds) {
      if (!myStoreIds.has(storeId)) {
        throw new ForbiddenException(`Store ${storeId} is not yours`);
      }
    }

    const desired = new Set(desiredStoreIds);

    for (const store of myStores) {
      const sid = store._id.toString();
      const onStore = (store.messengers || []).some(
        (id) => id.toString() === messengerId,
      );
      if (desired.has(sid) && !onStore) {
        await this.storesService.assignMessenger(sid, providerId, { messengerId });
      } else if (!desired.has(sid) && onStore) {
        await this.storesService.removeMessenger(sid, providerId, messengerId);
      }
    }
  }

  private async getOwnedMember(providerId: string, memberId: string) {
    const member = await this.usersService.findOne(memberId);
    const employer =
      (member as Manager).employer?.toString?.() ||
      (member as any).employer?.toString?.();
    if (employer !== providerId) {
      throw new ForbiddenException('This user is not part of your team');
    }
    if (member.role !== Role.MESSENGER && member.role !== Role.MANAGER) {
      throw new BadRequestException('User is not a team member role');
    }
    return member;
  }

  private async assertProvider(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (user.role !== Role.PROVIDER) {
      throw new ForbiddenException('Only providers can manage a team');
    }
    return user;
  }

  private canAssignToStores(member: User) {
    if (member.role === Role.MESSENGER) return true;
    if (member.role === Role.MANAGER && (member as Manager).isMessenger === true) {
      return true;
    }
    return false;
  }
}
