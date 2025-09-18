import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from '../controllers/admin-users.controller';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IdDto } from '../../../common/dto/id.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { ApiResponseDto } from '../../../common/dto/response.dto';
import { User, Role } from '../schemas/user.schema';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CaslAbilityFactory } from '../../casl/factories/casl-ability.factory';
import { Reflector } from '@nestjs/core';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAllPaginated: jest.fn(),
    updateOtherUser: jest.fn(),
    removeOtherUser: jest.fn(),
  };

  const mockCaslAbilityFactory = {
    createForUser: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  const mockUser: User = {
    id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockCustomerUser: User = {
    id: 'customer123',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+0987654321',
    role: Role.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: CaslAbilityFactory,
          useValue: mockCaslAbilityFactory,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAdmin', () => {
    it('should create an admin user successfully', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin.user@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: Role.ADMIN,
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.createAdmin(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto, Role.ADMIN);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.message).toEqual('Admin user created successfully');
      expect(result.data).toEqual(mockUser);
    });

    it('should handle validation errors when creating admin user', async () => {
      const createUserDto: CreateUserDto = {
        firstName: '',
        lastName: 'User',
        email: 'invalid-email',
        password: '123', // Too short
        phone: '+1234567890',
        role: Role.ADMIN,
      };

      mockUsersService.create.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(controller.createAdmin(createUserDto)).rejects.toThrow();
    });

    it('should handle service errors when creating admin user', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin.user@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: Role.ADMIN,
      };

      mockUsersService.create.mockRejectedValue(
        new Error('Email already exists')
      );

      await expect(controller.createAdmin(createUserDto)).rejects.toThrow();
    });
  });

  describe('findOtherUser', () => {
    it('should find a user successfully', async () => {
      const idDto: IdDto = { id: 'customer123' };
      const expectedResponse = new ApiResponseDto('User found', mockCustomerUser);

      mockUsersService.findOne.mockResolvedValue(mockCustomerUser);

      const result = await controller.findOtherUser(idDto);

      expect(usersService.findOne).toHaveBeenCalledWith('customer123');
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.message).toBeUndefined();
      expect(result.data).toEqual(mockCustomerUser);
    });

    it('should handle user not found', async () => {
      const idDto: IdDto = { id: 'nonexistent123' };

      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.findOtherUser(idDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid ID format', async () => {
      const idDto: IdDto = { id: 'invalid-id' };

      mockUsersService.findOne.mockRejectedValue(
        new Error('Invalid ID format')
      );

      await expect(controller.findOtherUser(idDto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return paginated users list without role filter', async () => {
      const query: ListUsersQueryDto = {
        page: 1,
        perPage: 10,
      };

      const mockUsersList = [mockUser, mockCustomerUser];
      const mockPaginatedList: PaginatedListDto<User> = {
        items: mockUsersList,
        total: 2,
        page: 1,
        perPage: 10,
        totalPages: 1,
      }

      mockUsersService.findAllPaginated.mockResolvedValue(mockPaginatedList);

      const result = await controller.findAll(query);

      expect(usersService.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.message).toBeUndefined();
      expect(result.data).toEqual(mockPaginatedList);
    });

    it('should return paginated users list with role filter', async () => {
      const query: ListUsersQueryDto = {
        page: 1,
        perPage: 10,
        role: Role.CUSTOMER,
      };

      const mockFilteredUsersList = [mockCustomerUser];
      const mockPaginatedList: PaginatedListDto<User> = {
        items: mockFilteredUsersList,
        total: 1,
        page: 1,
        perPage: 10,
        totalPages: 1,
      };

      mockUsersService.findAllPaginated.mockResolvedValue(mockPaginatedList);

      const result = await controller.findAll(query);

      expect(usersService.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.message).toBeUndefined();
      expect(result.data).toEqual(mockPaginatedList);
    });

    it('should return empty list when no users found', async () => {
      const query: ListUsersQueryDto = {
        page: 1,
        perPage: 10,
      };
      const mockPaginatedList: PaginatedListDto<User> = {
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
        totalPages: 0,
      };

      mockUsersService.findAllPaginated.mockResolvedValue(mockPaginatedList);

      const result = await controller.findAll(query);

      expect(usersService.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.message).toBeUndefined();
      expect(result.data).toEqual(mockPaginatedList);
    });

    it('should handle service errors when finding all users', async () => {
      const query: ListUsersQueryDto = {
        page: 1,
        perPage: 10,
      };

      mockUsersService.findAllPaginated.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(controller.findAll(query)).rejects.toThrow();
    });
  });

  describe('updateOtherUser', () => {
    it('should update another user successfully', async () => {
      const idDto: IdDto = { id: 'customer123' };
      const updateUserDto: UpdateUserDto = {
        firstName: 'UpdatedJane',
        lastName: 'UpdatedSmith',
        email: 'updated.jane@example.com',
        phone: '+1111111111',
        role: Role.PROVIDER,
        isActive: false,
      };

      const updatedUser = { ...mockCustomerUser, ...updateUserDto };
      mockUsersService.updateOtherUser.mockResolvedValue(updatedUser);

      const result = await controller.updateOtherUser(idDto, updateUserDto);

      expect(usersService.updateOtherUser).toHaveBeenCalledWith('customer123', updateUserDto);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.message).toEqual('User updated');
      expect(result.data).toEqual(updatedUser);

    });

    it('should update user password when included in DTO', async () => {
      const idDto: IdDto = { id: 'customer123' };
      const updateUserDto: Partial<UpdateUserDto> = {
        firstName: 'UpdatedJane',
        password: 'newPassword123',
      };

      mockUsersService.updateOtherUser.mockResolvedValue(mockCustomerUser);

      const result = await controller.updateOtherUser(idDto, updateUserDto);

      expect(usersService.updateOtherUser).toHaveBeenCalledWith('customer123', updateUserDto);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.message).toEqual('User updated');
      expect(result.data).toEqual(mockCustomerUser);
    });

    it('should handle user not found when updating', async () => {
      const idDto: IdDto = { id: 'nonexistent123' };
      const updateUserDto: Partial<UpdateUserDto> = {
        firstName: 'UpdatedName',
      };

      mockUsersService.updateOtherUser.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.updateOtherUser(idDto, updateUserDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle validation errors when updating user', async () => {
      const idDto: IdDto = { id: 'customer123' };
      const updateUserDto: Partial<UpdateUserDto> = {
        email: 'invalid-email',
      };

      mockUsersService.updateOtherUser.mockRejectedValue(
        new Error('Invalid email format')
      );

      await expect(controller.updateOtherUser(idDto, updateUserDto)).rejects.toThrow();
    });
  });

  describe('removeOtherUser', () => {
    it('should remove another user successfully', async () => {
      const idDto: IdDto = { id: 'customer123' };
      mockUsersService.removeOtherUser.mockResolvedValue(mockCustomerUser);

      const result = await controller.removeOtherUser(idDto);

      expect(usersService.removeOtherUser).toHaveBeenCalledWith('customer123');
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.message).toEqual('User deleted');
      expect(result.data).toEqual(mockCustomerUser);
    });

    it('should handle user not found when deleting', async () => {
      const idDto: IdDto = { id: 'nonexistent123' };

      mockUsersService.removeOtherUser.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.removeOtherUser(idDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle deletion of user that cannot be deleted', async () => {
      const idDto: IdDto = { id: 'admin123' };

      mockUsersService.removeOtherUser.mockRejectedValue(
        new ForbiddenException('Cannot delete admin user')
      );

      await expect(controller.removeOtherUser(idDto)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should handle service errors when deleting user', async () => {
      const idDto: IdDto = { id: 'customer123' };

      mockUsersService.removeOtherUser.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(controller.removeOtherUser(idDto)).rejects.toThrow();
    });
  });
});