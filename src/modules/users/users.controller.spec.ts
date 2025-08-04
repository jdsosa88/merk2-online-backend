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

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [mockUser];
      const expectedResponse = new ApiResponseDto('Users retrieved successfully', mockUsers);
      mockUsersService.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll();

      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
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

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const expectedResponse = new ApiResponseDto('User deleted successfully');
      mockUsersService.remove.mockResolvedValue(expectedResponse);

      const mockRequest = { user: mockUser };

      const result = await controller.remove(mockRequest);

      expect(usersService.remove).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle user not found when removing', async () => {
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('User not found')
      );

      const mockRequest = { user: mockUser };

      await expect(controller.remove(mockRequest)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const setPasswordDto: SetPasswordDto = {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      const expectedResponse = new ApiResponseDto('Password updated successfully');
      mockUsersService.updatePassword.mockResolvedValue(expectedResponse);

      const mockRequest = { user: mockUser };

      const result = await controller.updatePassword(mockRequest, setPasswordDto);

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
        controller.updatePassword(mockRequest, setPasswordDto)
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        code: '123456',
        newPassword: 'newpassword123',
      };

      const expectedResponse = new ApiResponseDto('Password reset successfully');
      mockUsersService.resetPassword.mockResolvedValue(expectedResponse);

      const mockRequest = { user: mockUser };

      const result = await controller.resetPassword(mockRequest, resetPasswordDto);

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
        controller.resetPassword(mockRequest, resetPasswordDto)
      ).rejects.toThrow();
    });
  });
});