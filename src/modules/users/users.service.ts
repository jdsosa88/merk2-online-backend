import { BadRequestException, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { SetPasswordDto } from './dto/set-password.dto';
import { ApiResponseDto } from 'src/common/dto/response.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(
    User.name) private userModel: Model<User>,
    private readonly mailerService: MailerService,
    private readonly verificationCodeService: VerificationCodeService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<ApiResponseDto<User>> {
    try {
      delete createUserDto.role;
      const user = await this.saveNewUser(createUserDto);
      const userId: Types.ObjectId = user._id as Types.ObjectId;
      const activationCode = await this.verificationCodeService.createCode(userId, 'activation', 3);
      await this.sendActivationCodeEmail(user.email, activationCode.code);
      return new ApiResponseDto(
        "User created, please check your email for the activation code",
        user
      );
    } catch (error) {
      throw error;
    }
  }

  async findAll(): Promise<ApiResponseDto<User[]>> {
    try {
      const users = await this.userModel.find().exec();
      return new ApiResponseDto(users);
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<ApiResponseDto<User>> {
    try {
      delete updateUserDto.password;
      delete updateUserDto.isActive;

      const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
      if (!user) throw new NotFoundException('User not found');
      return new ApiResponseDto("User updated", user);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<ApiResponseDto<User>> {
    try {
      const user = await this.userModel.findByIdAndDelete(id).exec();
      if (!user) throw new NotFoundException('User not found');
      return new ApiResponseDto("User deleted", user);
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(id: string, setPasswordDto: SetPasswordDto): Promise<ApiResponseDto> {
    try {
      const { oldPassword, newPassword } = setPasswordDto;
      if (oldPassword === newPassword) throw new BadRequestException('The old and new passwords must be different');

      const user = await this.userModel.findById(id).select('+password').exec();
      if (!user) throw new NotFoundException('User not found');

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) throw new BadRequestException('Old password is incorrect');

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      return new ApiResponseDto("Password changed successfully");
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto> {
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
      return new ApiResponseDto("Password changed successfully");
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
    const userToSave = { ...createUserDto, password: hashedPassword, isActive: false };
    const user = await this.userModel.create(userToSave);
    return user;
  }

  private async sendActivationCodeEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Activation Code',
      text: `Your activation code is: ${code}`,
      html: `<p>Your activation code is: <b>${code}</b></p>`,
    });
  }

}
