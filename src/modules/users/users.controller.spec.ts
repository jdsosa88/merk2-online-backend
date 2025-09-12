import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { User, UserRole } from './user.schema';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { VerificationCodeDto } from './dto/verification-code.dto';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updatePassword: jest.fn(),
    resetPassword: jest.fn(),
    createDeleteVerificationCode: jest.fn(),
  };

  const mockUser = {
    id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    role: 'CUSTOMER' as UserRole,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: CaslAbilityFactory,
          useValue: { createForUser: jest.fn() }, // mockea los métodos que uses
        },

      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'CUSTOMER' as UserRole,
      };

      const expectedResponse = new ApiResponseDto('User created successfully', mockUser);
      mockUsersService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle validation errors when creating user', async () => {
      const createUserDto: CreateUserDto = {
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email',
        password: '123', // Too short
        phone: '+1234567890',
      };

      mockUsersService.create.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(controller.create(createUserDto)).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return current user profile', async () => {
      const mockRequest = { user: mockUser };

      const result = await controller.findOne(mockRequest);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      const expectedResponse = new ApiResponseDto('User updated successfully', updatedUser);
      mockUsersService.update.mockResolvedValue(expectedResponse);

      const mockRequest = { user: mockUser };

      const result = await controller.update(mockRequest, updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle user not found when updating', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
      };

      mockUsersService.update.mockRejectedValue(
        new NotFoundException('User not found')
      );

      const mockRequest = { user: mockUser };

      await expect(controller.update(mockRequest, updateUserDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('requestDeleteVerificationCode', () => {
    it('should request delete verification code successfully', async () => {
      const expectedResponse = new ApiResponseDto('A delete code has been sent to your email');
      mockUsersService.createDeleteVerificationCode.mockResolvedValue(expectedResponse);

      const mockRequest = { user: mockUser };

      const result = await controller.requestDeleteVerificationCode(mockRequest);

      expect(usersService.createDeleteVerificationCode).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors when requesting delete verification code', async () => {
      mockUsersService.createDeleteVerificationCode.mockRejectedValue(
        new NotFoundException('User not found')
      );

      const mockRequest = { user: mockUser };

      await expect(
        controller.requestDeleteVerificationCode(mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });


  describe('remove', () => {
    it('should remove user successfully', async () => {
      const expectedResponse = new ApiResponseDto('User deleted successfully');
      mockUsersService.remove.mockResolvedValue(expectedResponse);

      const mockRequest = { user: mockUser };
      const verificationCodeDto: VerificationCodeDto = { code: '123456' };

      const result = await controller.remove(mockRequest, verificationCodeDto);

      expect(usersService.remove).toHaveBeenCalledWith(mockUser.id, "123456");
      expect(result).toEqual(expectedResponse);
    });

    it('should handle user not found when removing', async () => {
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('User not found')
      );

      const mockRequest = { user: mockUser };
      const verificationCodeDto: VerificationCodeDto = { code: '123456' };

      await expect(controller.remove(mockRequest, verificationCodeDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('setPassword', () => {
    it('should set password successfully', async () => {
      const setPasswordDto: SetPasswordDto = {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      const expectedResponse = new ApiResponseDto('Password updated successfully');
      mockUsersService.updatePassword.mockResolvedValue(expectedResponse);

      const mockRequest = { user: mockUser };

      const result = await controller.setPassword(mockRequest, setPasswordDto);

      expect(usersService.updatePassword).toHaveBeenCalledWith(mockUser.id, setPasswordDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle invalid current password', async () => {
      const setPasswordDto: SetPasswordDto = {
        oldPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      mockUsersService.updatePassword.mockRejectedValue(
        new UnauthorizedException('Invalid current password')
      );

      const mockRequest = { user: mockUser };

      await expect(
        controller.setPassword(mockRequest, setPasswordDto)
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changeForgottenPassword', () => {
    it('should change forgotten password successfully', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        code: '123456',
        newPassword: 'newpassword123',
      };

      const expectedResponse = new ApiResponseDto('Password reset successfully');
      mockUsersService.resetPassword.mockResolvedValue(expectedResponse);

      const mockRequest = { user: mockUser };

      const result = await controller.changeForgottenPassword(mockRequest, resetPasswordDto);

      expect(usersService.resetPassword).toHaveBeenCalledWith(mockUser.id, resetPasswordDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle invalid reset code', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        code: 'invalid',
        newPassword: 'newpassword123',
      };

      mockUsersService.resetPassword.mockRejectedValue(
        new Error('Invalid reset code')
      );

      const mockRequest = { user: mockUser };

      await expect(
        controller.changeForgottenPassword(mockRequest, resetPasswordDto)
      ).rejects.toThrow();
    });
  });
});