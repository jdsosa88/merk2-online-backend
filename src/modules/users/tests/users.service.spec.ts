import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { UsersService } from '../services/users.service';
import { Role, User, UserRole } from '../schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { SetPasswordDto } from '../dto/set-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerificationCodeService } from '../../verification-code/services/verification-code.service';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let userModel: jest.Mocked<Model<User>>;
  let mailerService: any;
  let verificationCodeService: any;

  const mockObjectId = new Types.ObjectId();

  const mockUser = {
    _id: mockObjectId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    role: 'CUSTOMER' as UserRole,
    isActive: true,
    password: 'hashedPassword123',
    save: jest.fn(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockUserModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    exists: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
    select: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockVerificationCodeService = {
    createCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: VerificationCodeService,
          useValue: mockVerificationCodeService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
    mailerService = module.get(MailerService);
    verificationCodeService = module.get(VerificationCodeService);

    // Setup common bcrypt mocks
    mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create CUSTOMER user successfully', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'CUSTOMER' as UserRole,
      };

      const mockActivationCode = {
        code: '123456',
        _id: mockObjectId,
      };

      // Mock dependencies
      mockUserModel.exists.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockVerificationCodeService.createCode.mockResolvedValue(mockActivationCode as any);
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.create(createUserDto);

      expect(mockUserModel.exists).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        role: 'CUSTOMER',
        password: 'hashedPassword123',
        isActive: false,
        isPhoneVerified: false,
      });
      expect(mockVerificationCodeService.createCode).toHaveBeenCalledWith(
        mockObjectId,
        'activation',
        3,
      );
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: createUserDto.email,
        subject: 'ACTIVATION CODE',
        text: `Your activation code is: ${mockActivationCode.code}`,
        html: `<p>Your activation code is: <b>${mockActivationCode.code}</b></p>`,
      });
      expect(result).toEqual(mockUser);
    });

    it('should create ADMIN user successfully without sending activation code', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: Role.ADMIN,
      };

      const mockAdminUser = {
        ...mockUser,
        ...createUserDto,
        isActive: true,
      };

      mockUserModel.exists.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockAdminUser);

      const result = await service.create(createUserDto, Role.ADMIN);

      expect(mockUserModel.exists).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        role: Role.ADMIN,
        password: 'hashedPassword123',
        isActive: true, // Should be true for admin
        isPhoneVerified: true, // Should be true for admin
      });
      // Should not send activation code for admin
      expect(mockVerificationCodeService.createCode).not.toHaveBeenCalled();
      expect(mockMailerService.sendMail).not.toHaveBeenCalled();
      expect(result).toEqual(mockAdminUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        phone: '+1234567890',
      };

      mockUserModel.exists.mockResolvedValue({ _id: mockObjectId });

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );

      expect(mockUserModel.exists).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllPaginated', () => {
    it('should find all users successfully', async () => {
      const mockUsers = [mockUser];
      const mockTotal = 1;

      // Mock the chained query for finding users
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      };
      mockUserModel.find.mockReturnValueOnce(mockQuery as any);

      // Mock countDocuments query
      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(mockTotal),
      };
      mockUserModel.countDocuments.mockReturnValueOnce(mockCountQuery as any);

      const query: ListUsersQueryDto = {
        page: 1,
        perPage: 25,
      }
      const result = await service.findAllPaginated(query);

      expect(mockUserModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(25);
      expect(mockUserModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toEqual({
        items: mockUsers,
        total: mockTotal,
        page: 1,
        perPage: 25,
        totalPages: 1,
      });
    });

    it('should filter users by role', async () => {
      const mockUsers = [mockUser];
      const mockTotal = 1;
      const query: ListUsersQueryDto = {
        page: 1,
        perPage: 25,
        role: Role.CUSTOMER,
      };

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      };
      mockUserModel.find.mockReturnValueOnce(mockQuery as any);

      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(mockTotal),
      };
      mockUserModel.countDocuments.mockReturnValueOnce(mockCountQuery as any);

      const result = await service.findAllPaginated(query);

      expect(mockUserModel.find).toHaveBeenCalledWith({ role: { $in: [Role.CUSTOMER] } });
      expect(result).toEqual({
        items: mockUsers,
        total: mockTotal,
        page: 1,
        perPage: 25,
        totalPages: 1,
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');

      // Mock the chained query to throw an error
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(error),
      };
      mockUserModel.find.mockReturnValue(mockQuery as any);

      const query: ListUsersQueryDto = {
        page: 1,
        perPage: 25,
      }
      await expect(service.findAllPaginated(query)).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    it('should find user by ID successfully', async () => {
      const userId = mockObjectId.toString();
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const result = await service.findOne(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(new Types.ObjectId(userId));
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = mockObjectId.toString();
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne(userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockUserModel.findById).toHaveBeenCalledWith(new Types.ObjectId(userId));
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = mockObjectId.toString();
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      } as any);

      const result = await service.update(userId, updateUserDto);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(userId),
        {
          firstName: updateUserDto.firstName,
          lastName: updateUserDto.lastName,
          email: updateUserDto.email,
          phone: updateUserDto.phone,
          // password and isActive should be excluded
        },
        { new: true },
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found during update', async () => {
      const userId = mockObjectId.toString();
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
      };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('createDeleteVerificationCode', () => {
    it('should create and send delete verification code', async () => {
      const userId = mockObjectId;
      const email = 'test@example.com';

      mockVerificationCodeService.createCode.mockResolvedValue({ code: '123456' });
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.createDeleteVerificationCode(userId, email);

      expect(mockVerificationCodeService.createCode).toHaveBeenCalledWith(
        userId,
        'delete',
      );
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'DELETE CODE',
        text: 'Your delete code is: 123456',
        html: '<p>Your delete code is: <b>123456</b></p>',
      });
      expect(result).toBe('A delete code has been sent to your email');
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException when try to pass an invalid or expired code', async () => {
      const userId = mockObjectId;
      mockVerificationCodeService.verifyCode.mockResolvedValue(false); // Invalid code

      await expect(service.remove(userId, '000000')).rejects.toThrow(
        new BadRequestException('Invalid or expired activation code'),
      );
    });

    it('should throw NotFoundException when user not found during removal', async () => {
      const userId = mockObjectId;
      mockVerificationCodeService.verifyCode.mockResolvedValue(true);
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove(userId, '123456')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should remove user successfully', async () => {
      const userId = mockObjectId;
      mockVerificationCodeService.verifyCode.mockResolvedValue(true);
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const result = await service.remove(userId, '123456');

      expect(mockVerificationCodeService.verifyCode).toHaveBeenCalledWith(
        userId,
        '123456',
        'delete',
      );
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const userId = mockObjectId.toString();
      const setPasswordDto: SetPasswordDto = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      const userWithPassword = { ...mockUser, password: 'hashedOldPassword' };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(userWithPassword),
        }),
      } as any);

      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('hashedNewPassword123' as never);
      userWithPassword.save = jest.fn().mockResolvedValue(userWithPassword);

      const result = await service.updatePassword(userId, setPasswordDto);

      expect(mockUserModel.findById).toHaveBeenCalledWith(new Types.ObjectId(userId));
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        setPasswordDto.oldPassword,
        'hashedOldPassword',
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(setPasswordDto.newPassword, 10);
      expect(userWithPassword.save).toHaveBeenCalled();
      expect(result).toBe('Password changed successfully');
    });

    it('should throw BadRequestException when old and new passwords are the same', async () => {
      const userId = mockObjectId.toString();
      const setPasswordDto: SetPasswordDto = {
        oldPassword: 'samePassword123',
        newPassword: 'samePassword123',
      };

      await expect(service.updatePassword(userId, setPasswordDto)).rejects.toThrow(
        new BadRequestException('The old and new passwords must be different'),
      );
    });

    it('should throw NotFoundException when user not found during password update', async () => {
      const userId = mockObjectId.toString();
      const setPasswordDto: SetPasswordDto = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      await expect(service.updatePassword(userId, setPasswordDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should throw BadRequestException when old password is incorrect', async () => {
      const userId = mockObjectId.toString();
      const setPasswordDto: SetPasswordDto = {
        oldPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      const userWithPassword = { ...mockUser, password: 'hashedCorrectPassword' };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(userWithPassword),
        }),
      } as any);

      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.updatePassword(userId, setPasswordDto)).rejects.toThrow(
        new BadRequestException('Old password is incorrect'),
      );

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        setPasswordDto.oldPassword,
        userWithPassword.password,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const userId = mockObjectId.toString();
      const resetPasswordDto: ResetPasswordDto = {
        code: '123456',
        newPassword: 'newPassword123',
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      mockVerificationCodeService.verifyCode.mockResolvedValue(true);
      mockedBcrypt.hash.mockResolvedValue('hashedNewPassword123' as never);
      mockUser.save = jest.fn().mockResolvedValue(mockUser);

      const result = await service.resetPassword(userId, resetPasswordDto);

      expect(mockUserModel.findById).toHaveBeenCalledWith(new Types.ObjectId(userId));
      expect(mockVerificationCodeService.verifyCode).toHaveBeenCalledWith(
        mockUser._id,
        resetPasswordDto.code,
        'reset_password',
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(resetPasswordDto.newPassword, 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toBe('Password changed successfully');
    });

    it('should throw NotFoundException when user not found during password reset', async () => {
      const userId = mockObjectId.toString();
      const resetPasswordDto: ResetPasswordDto = {
        code: '123456',
        newPassword: 'newPassword123',
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.resetPassword(userId, resetPasswordDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should throw BadRequestException when reset code is invalid', async () => {
      const userId = mockObjectId.toString();
      const resetPasswordDto: ResetPasswordDto = {
        code: 'invalidCode',
        newPassword: 'newPassword123',
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      mockVerificationCodeService.verifyCode.mockResolvedValue(false);

      await expect(service.resetPassword(userId, resetPasswordDto)).rejects.toThrow(
        new BadRequestException('Invalid or expired reset password code'),
      );
    });
  });

  describe('updateOtherUser', () => {
    it('should update other user including password', async () => {
      const userId = mockObjectId.toString();
      const notHashedPassword = 'newPassword123';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
        password: notHashedPassword,
      };

      const updatedUser = { ...mockUser, ...updateUserDto, password: 'hashedNewPassword123' };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      } as any);

      mockedBcrypt.hash.mockResolvedValue('hashedNewPassword123' as never);

      const result = await service.updateOtherUser(userId, updateUserDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(notHashedPassword, 10);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(userId),
        {
          ...updateUserDto,
          password: 'hashedNewPassword123',
        },
        { new: true },
      );
      expect(result).toEqual(updatedUser);
    });

    it('should update other user without password if not provided', async () => {
      const userId = mockObjectId.toString();
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      } as any);

      const result = await service.updateOtherUser(userId, updateUserDto);

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(userId),
        updateUserDto,
        { new: true },
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('removeOtherUser', () => {
    it('should remove other user without code', async () => {
      const userId = mockObjectId.toString();
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const result = await service.removeOtherUser(userId);

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(new Types.ObjectId(userId));
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found during removal', async () => {
      const userId = mockObjectId.toString();
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.removeOtherUser(userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email with password', async () => {
      const email = 'test@example.com';
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      } as any);

      const result = await service.findByEmail(email, true);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('should find user by email without password', async () => {
      const email = 'test@example.com';
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const result = await service.findByEmail(email, false);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      const email = 'nonexistent@example.com';
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.findByEmail(email, false);

      expect(result).toBeNull();
    });
  });
});