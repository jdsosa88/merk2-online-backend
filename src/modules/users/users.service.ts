import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import { UpdateUserDto, UpdateUserAllDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { SetPasswordDto } from './dto/set-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PaginatedListDto } from '../../common/dto/paginated-list.dto';
import { ICreateUser } from './types/users.interface';
import { Provider } from './schemas/provider.schema';
import { UserFactory } from './user.factory';
import { Manager } from './schemas/manager.schema';
import { Messenger } from './schemas/messenger.schema';
import { CreateUserFactoryDto, UpdateUserFactoryDto } from './types/user-factory.type';
import { Role } from './types/users.type';
import { ConfigService } from '@nestjs/config';
import { ImagesService } from '../images/images.service';
import { StoresService } from '../stores/stores.service';
import { DELIVERY_REGION } from '../delivery/types/delivery.constants';
import { DeliveryService } from '../delivery/delivery.service';


@Injectable()
export class UsersService {
  constructor(
    private userFactory: UserFactory,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailerService: MailerService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
    @Inject(forwardRef(() => StoresService))
    private readonly storesService: StoresService,
    private readonly deliveryService: DeliveryService,
  ) { }

  async create(createUserDto: CreateUserFactoryDto, role: Role = Role.CUSTOMER): Promise<User> {
    try {
      createUserDto.role = role;
      const user = await this.userFactory.createUser({ createUserDto });
      if (role === Role.CUSTOMER) {
        const verificationTimeInHours = this.configService.get<number>('verificationCode.expiresHours') || 3;
        const activationCode = await this.verificationCodeService.createCode(
          user._id,
          'activation',
          verificationTimeInHours
        );
        await this.sendCodeEmail(user.email, 'activation', activationCode.code);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async createGoogleUser(userData: ICreateUser): Promise<User> {
    return await this.userFactory.createUser({ createUserDto: userData });

  }

  async findAllPaginated(query: ListUsersQueryDto): Promise<PaginatedListDto<User>> {
    try {
      const page: number = Number(query.page) || 1;
      const perPage: number = Number(query.perPage) || 25;

      const filter: any = {};
      if (query.role && query.role.trim().length > 0) {
        const roles = query.role.split(',').map(r => r.trim()).filter((rol) => {
          return rol === Role.ADMIN
            || rol === Role.CUSTOMER
            || rol === Role.MESSENGER
            || rol === Role.MANAGER
            || rol === Role.PROVIDER;
        });
        if (roles.length > 0) {
          filter.role = { $in: roles };
        }
      }

      const items: User[] = await this.userModel
        .find(filter)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();
      const total: number = await this.userModel.countDocuments(filter).exec();
      const totalPages: number = Math.ceil(total / perPage) || 1;
      const paginatedList: PaginatedListDto<User> = {
        items,
        total,
        page,
        perPage,
        totalPages,
      };

      return paginatedList;

    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const _id = new Types.ObjectId(id);
      const user: User | null = await this.userModel.findById(_id).populate('avatar').exec();
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserFactoryDto): Promise<User> {
    try {
      const existing = await this.findOne(id);
      const dto = updateUserDto as UpdateUserAllDto;
      const salesAreaChanging =
        existing.role === Role.PROVIDER &&
        (dto.salesProvince !== undefined || dto.salesMunicipality !== undefined);

      if (salesAreaChanging) {
        const nextProvince = (
          dto.salesProvince ??
          (existing as Provider).salesProvince ??
          DELIVERY_REGION.province
        ).trim();
        const nextMunicipality = (
          dto.salesMunicipality ??
          (existing as Provider).salesMunicipality ??
          DELIVERY_REGION.municipality
        ).trim();

        const regions = await this.deliveryService.listSalesRegions();
        const valid = regions.some(
          (r) =>
            r.province.toLowerCase() === nextProvince.toLowerCase() &&
            r.municipality.toLowerCase() === nextMunicipality.toLowerCase(),
        );
        if (!valid) {
          throw new BadRequestException(
            `No hay zonas de mensajería para ${nextProvince} / ${nextMunicipality}`,
          );
        }

        dto.salesProvince = nextProvince;
        dto.salesMunicipality = nextMunicipality;
      }

      const user = await this.saveUpdatedUser(id, dto);

      if (salesAreaChanging) {
        await this.storesService.syncProviderStoresDeliveryArea(
          id,
          (user as Provider).salesProvince,
          (user as Provider).salesMunicipality,
        );
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async linkGoogleAccount(userId: Types.ObjectId, googleId: string): Promise<User> {
    const user: User | null = await this.userModel.findByIdAndUpdate(userId, { googleId }, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createDeleteVerificationCode(userId: Types.ObjectId, email: string): Promise<string> {
    try {
      const verificationTimeInHours = this.configService.get<number>('verificationCode.expiresHours') || 3;
      const deleteCode = await this.verificationCodeService.createCode(
        userId,
        'delete',
        verificationTimeInHours
      );
      await this.sendCodeEmail(email, 'delete', deleteCode.code);
      return "A delete code has been sent to your email";
    } catch (error) {
      throw error;
    }
  }

  async remove(id: Types.ObjectId, code: string): Promise<User> {
    try {
      const isVerifiedCode = await this.verificationCodeService.verifyCode(id, code, 'delete');
      if (!isVerifiedCode) throw new BadRequestException('Invalid or expired activation code');
      return this.deleteSavedUser(id);
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(id: string, setPasswordDto: SetPasswordDto): Promise<string> {
    try {
      const { oldPassword, newPassword } = setPasswordDto;
      if (oldPassword === newPassword) throw new BadRequestException('The old and new passwords must be different');
      const _id = new Types.ObjectId(id);
      const user = await this.userModel.findById(_id).select('+password').exec();
      if (!user) throw new NotFoundException('User not found');

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) throw new BadRequestException('Old password is incorrect');

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      return "Password changed successfully";
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto): Promise<string> {
    try {
      const _id = new Types.ObjectId(id);
      const user = await this.userModel.findById(_id).exec();
      if (!user) throw new NotFoundException('User not found');

      const isVerifiedCode = await this.verificationCodeService.verifyCode(
        user._id,
        resetPasswordDto.code,
        'reset_password'
      );
      if (!isVerifiedCode) throw new BadRequestException('Invalid or expired reset password code');

      user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      await user.save();
      return "Password changed successfully";
    } catch (error) {
      throw error;
    }
  }

  async updateOtherUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      return await this.saveUpdatedUser(id, updateUserDto);
    } catch (error) {
      throw error;
    }
  }

  async removeOtherUser(id: string): Promise<User> {
    try {
      return this.deleteSavedUser(new Types.ObjectId(id));
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email: string, findWithPassword: boolean = true): Promise<User | null> {
    if (findWithPassword === true) {
      return await this.userModel.findOne({ email }).select('+password').exec();
    }
    return await this.userModel.findOne({ email }).exec();
  }

  async findByEmployer(employerId: string, roles?: Role[]): Promise<User[]> {
    const filter: Record<string, unknown> = {
      employer: new Types.ObjectId(employerId),
    };
    if (roles?.length) {
      filter.role = { $in: roles };
    }
    return this.userModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (!ids.length) return [];
    return this.userModel
      .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
      .exec();
  }

  async saveUpdatedUser(userId: string | Types.ObjectId, updateUserDto: UpdateUserFactoryDto): Promise<User> {
    const id = new Types.ObjectId(userId);
    return await this.userFactory.updateUser({ userId: id, updateUserDto });
  }

  private async deleteSavedUser(userId: Types.ObjectId): Promise<User> {
    const user: User | null = await this.userModel.findByIdAndDelete(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async sendCodeEmail(email: string, codeType: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: `${codeType.toUpperCase()} CODE`,
      text: `Your ${codeType} code is: ${code}`,
      html: `<p>Your ${codeType} code is: <b>${code}</b></p>`,
    });
  }

  async uploadOtherUserAvatarImage(otherUserId: string, file: Express.Multer.File): Promise<User> {
    const otherUser = await this.findOne(otherUserId);
    return await this.uploadAvatarImage(otherUser, file);
  }

  async uploadAvatarImage(user: User, file: Express.Multer.File): Promise<User> {
    try {
      if (user.avatar?._id) {
        await this.imagesService.delete(user.avatar._id.toString());
      }
      const image = await this.imagesService.createFromFile(file, `User avatar`);
      return await this.update(user._id.toString(), { avatar: image._id });
    } catch (error) {
      this.imagesService.deleteImageFile(file.filename);
      throw error;
    }

  }

  async deleteOtherUserAvatarImage(otherUserId: string): Promise<User> {
    let otherUser = await this.findOne(otherUserId);
    return await this.deleteAvatarImage(otherUser);
  }

  async deleteAvatarImage(user: User): Promise<User> {
    if (user.avatar?._id) {
      await this.imagesService.delete(user.avatar._id.toString());
      const updatedUser =  await this.userModel.findByIdAndUpdate(
        user._id, 
        { avatar: null }, 
        {new: true}
      ).populate('avatar').exec();
      if (!updatedUser) throw new BadRequestException("Errors occurred deleting user avatar.");
      return updatedUser;
    }
    return user;
  }
}
