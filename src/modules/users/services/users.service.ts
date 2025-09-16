import { BadRequestException, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role, User } from '../schemas/user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { SetPasswordDto } from '../dto/set-password.dto';
import { ApiResponseDto } from 'src/common/dto/response.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { VerificationCodeService } from '../../verification-code/services/verification-code.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ObjectValidationsUtils } from 'src/common/utils/object-validations';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { PaginatedListDto } from '../../../common/dto/paginated-list.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailerService: MailerService,
    private readonly verificationCodeService: VerificationCodeService,
  ) { }

  async create(createUserDto: CreateUserDto, role = Role.CUSTOMER): Promise<User> {
    try {
      createUserDto.role = role;
      const user: User = await this.saveNewUser(createUserDto);
      if (role === Role.CUSTOMER) {
        const userId: Types.ObjectId = user._id as Types.ObjectId;
        const activationCode = await this.verificationCodeService.createCode(userId, 'activation', 3);
        await this.sendCodeEmail(user.email, 'activation', activationCode.code);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findAllPaginated(query: ListUsersQueryDto): Promise<PaginatedListDto<User>> {
    try {
      const page: number = Number(query.page) || 1;
      const perPage: number = Number(query.perPage) || 25;

      const filter: any = {};
      if (query.role && query.role.trim().length > 0) {
        const roles = query.role.split(',').map(r => r.trim()).filter((rol) => {
          return rol === Role.ADMIN || rol === Role.CUSTOMER || rol === Role.MESSENGER || rol === Role.PROVIDER;
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
      const user = await this.userModel.findById(id).exec();
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      return await this.saveUpdatedUser(id, updateUserDto);
    } catch (error) {
      throw error;
    }
  }

  async createDeleteVerificationCode(userId: Types.ObjectId, email: string): Promise<string> {
    try {
      const deleteCode = await this.verificationCodeService.createCode(userId, 'delete');
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

      const user = await this.userModel.findById(id).select('+password').exec();
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
      const user = await this.userModel.findById(id).exec();
      if (!user) throw new NotFoundException('User not found');

      const isVerifiedCode = await this.verificationCodeService.verifyCode(
        user._id as Types.ObjectId,
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
      if (new ObjectValidationsUtils().isDefinedObject(updateUserDto.password)) {
        const newPassword: string = updateUserDto.password as string;
        updateUserDto.password = await bcrypt.hash(newPassword, 10);
      }
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

  private async saveNewUser(createUserDto: CreateUserDto): Promise<User> {
    const { email } = createUserDto;
    const existsUser = await this.userModel.exists({ email });
    if (existsUser) throw new ConflictException('Email already exists');
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userToSave = {
      ...createUserDto,
      password: hashedPassword,
      isActive: createUserDto.role === Role.ADMIN ? true : false
    };
    const user = await this.userModel.create(userToSave);
    return user;
  }

  private async saveUpdatedUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user: User | null = await this.userModel.findByIdAndUpdate(userId, updateUserDto, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
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

}
