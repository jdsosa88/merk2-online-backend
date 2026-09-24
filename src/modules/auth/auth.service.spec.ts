import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { ConfigService } from '@nestjs/config';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { UserLoginDto } from './dto/user-login.dto';
import { VerifyDefaultCodeUserDto } from './dto/verify-default-code-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { AuthTokensDto } from './dto/atuh-tokens.dto';
import { UserRole } from '../users/schemas/user.schema';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcryptCompare = jest.fn();

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let refreshTokenService: RefreshTokenService;
  let configService: ConfigService;
  let verificationCodeService: VerificationCodeService;
  let mailerService: MailerService;

  const mockObjectId = new Types.ObjectId();

  const mockUser = {
    _id: mockObjectId,
    id: mockObjectId.toString(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'hashedpassword',
    phone: '+1234567890',
    role: 'CUSTOMER' as UserRole,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: jest.fn(() => ({
      _id: mockObjectId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      phone: '+1234567890',
      role: 'CUSTOMER' as UserRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    save: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockRefreshTokenService = {
    findByToken: jest.fn(),
    delete: jest.fn(),
    deletePreviousToken: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockVerificationCodeService = {
    createCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    // Setup bcrypt mock
    (bcrypt.compare as jest.Mock) = mockBcryptCompare;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: VerificationCodeService,
          useValue: mockVerificationCodeService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    configService = module.get<ConfigService>(ConfigService);
    verificationCodeService = module.get<VerificationCodeService>(VerificationCodeService);
    mailerService = module.get<MailerService>(MailerService);

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRATION: '7d',
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const userLoginDto: UserLoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const ip = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should login successfully with valid credentials', async () => {
      const mockTokens: AuthTokensDto = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };
      const mockRefreshToken = { _id: 'refresh-id', token: 'refresh-token' };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce(mockTokens.access_token);
      mockJwtService.sign.mockReturnValueOnce(mockTokens.refresh_token);
      mockRefreshTokenService.deletePreviousToken.mockResolvedValue(undefined);
      mockRefreshTokenService.create.mockResolvedValue(mockRefreshToken);

      const result = await service.login({ dto: userLoginDto, ip, userAgent });

      expect(result.user._id).toStrictEqual(mockUser._id);
      expect(result.tokens.access_token).toBe(mockTokens.access_token);
      expect(result.tokens.refresh_token).toBe(mockTokens.refresh_token);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcryptCompare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login({ dto: userLoginDto, ip, userAgent }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(service.login({ dto: userLoginDto, ip, userAgent }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
        toObject: jest.fn(() => ({
          _id: mockObjectId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          phone: '+1234567890',
          role: 'CUSTOMER' as UserRole,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      };

      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      mockBcryptCompare.mockResolvedValue(true);

      await expect(service.login({ dto: userLoginDto, ip, userAgent }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const mockPayload = { sub: mockObjectId };
    const mockStoredToken = {
      _id: 'token-id',
      token: refreshToken,
      userId: mockObjectId,
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    it('should refresh token successfully', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenService.findByToken.mockResolvedValue(mockStoredToken);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValueOnce('new-access-token');

      const result = await service.refreshToken(refreshToken);

      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBe(refreshToken);
      expect(mockRefreshTokenService.create).not.toHaveBeenCalled();
      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret',
      });
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token not found in database', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenService.findByToken.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenService.findByToken.mockResolvedValue(mockStoredToken);
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRefreshTokenService.findByToken.mockResolvedValue(mockStoredToken);
      mockUsersService.findOne.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken(refreshToken))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const token: string = 'valid-refresh-token';

      mockRefreshTokenService.delete.mockResolvedValue(undefined);

      const result = await service.logout(token);

      expect(result).toBe('Logout successful');
      expect(mockRefreshTokenService.delete).toHaveBeenCalledWith(token);
    });

    it('should handle logout error gracefully', async () => {
      const token: string = 'invalid-refresh-token';

      mockRefreshTokenService.delete.mockRejectedValue(new Error('Token not found'));

      await expect(service.logout(token))
        .rejects.toThrow('Token not found');
    });
  });

  describe('activateUser', () => {
    const verifyDefaultCodeDto: VerifyDefaultCodeUserDto = {
      id: mockObjectId.toString(),
      code: '123456',
    };
    const ip = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should activate user successfully', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const mockTokens: AuthTokensDto = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };
      const mockRefreshToken = { _id: 'refresh-id', token: 'refresh-token' };

      mockUsersService.findOne.mockResolvedValue(inactiveUser);
      mockUsersService.update.mockResolvedValue({ ...inactiveUser, isActive: true });
      mockVerificationCodeService.verifyCode.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce('access-token');
      mockJwtService.sign.mockReturnValueOnce('refresh-token');
      mockRefreshTokenService.deletePreviousToken.mockResolvedValue(undefined);
      mockRefreshTokenService.create.mockResolvedValue(mockRefreshToken);

      const result = await service.activateUser({ dto: verifyDefaultCodeDto, ip, userAgent });

      expect(result.user).toStrictEqual({ ...inactiveUser, isActive: true });
      expect(result.user.isActive).toBe(true);
      expect(result.tokens.access_token).toBe(mockTokens.access_token);
      expect(result.tokens.refresh_token).toBe(mockTokens.refresh_token);
      expect(mockUsersService.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.activateUser({ dto: verifyDefaultCodeDto, ip, userAgent }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is already active', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser); // mockUser.isActive = true

      await expect(service.activateUser({ dto: verifyDefaultCodeDto, ip, userAgent }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with invalid activation code', async () => {
      const inactiveUser = { ...mockUser, isActive: false };

      mockUsersService.findOne.mockResolvedValue(inactiveUser);
      mockVerificationCodeService.verifyCode.mockResolvedValue(false);

      await expect(service.activateUser({ dto: verifyDefaultCodeDto, ip, userAgent }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('sendResetPasswordCode', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should send reset password code successfully', async () => {
      const mockCode = { code: '123456', _id: 'code-id' };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockVerificationCodeService.createCode.mockResolvedValue(mockCode);
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.sendResetPasswordCode(forgotPasswordDto);

      expect(result).toBe('A reset password code has been sent to your email');
      expect(mockVerificationCodeService.createCode).toHaveBeenCalledWith(
        mockObjectId,
        'reset_password',
        3
      );
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Reset Password Code',
        text: 'Your reset password code is: 123456',
        html: '<p>Your reset password code is: <b>123456</b></p>',
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.sendResetPasswordCode(forgotPasswordDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };

      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(service.sendResetPasswordCode(forgotPasswordDto))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyResetCode', () => {
    const verifyResetCodeDto: VerifyResetCodeDto = {
      email: 'test@example.com',
      code: '123456',
    };
    const ip = '127.0.0.1';
    const userAgent = 'test-agent';

    it('should verify reset code successfully', async () => {
      const mockTokens: AuthTokensDto = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };
      const mockRefreshToken = { _id: 'refresh-id', token: 'refresh-token' };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockVerificationCodeService.verifyCode.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce('access-token');
      mockJwtService.sign.mockReturnValueOnce('refresh-token');
      mockRefreshTokenService.deletePreviousToken.mockResolvedValue(undefined);
      mockRefreshTokenService.create.mockResolvedValue(mockRefreshToken);

      const result = await service.verifyResetCode({ dto: verifyResetCodeDto, ip, userAgent });

      expect(result.user).toBe(mockUser);
      expect(result.tokens.access_token).toBe(mockTokens.access_token);
      expect(result.tokens.refresh_token).toBe(mockTokens.refresh_token);
      expect(mockVerificationCodeService.verifyCode).toHaveBeenCalledWith(
        mockObjectId,
        '123456',
        'verify_reset_password'
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.verifyResetCode({ dto: verifyResetCodeDto, ip, userAgent }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };

      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(service.verifyResetCode({ dto: verifyResetCodeDto, ip, userAgent }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException with invalid reset code', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockVerificationCodeService.verifyCode.mockResolvedValue(false);

      await expect(service.verifyResetCode({ dto: verifyResetCodeDto, ip, userAgent }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('private methods integration', () => {
    it('should handle refresh token save failure', async () => {
      const userLoginDto: UserLoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');
      mockRefreshTokenService.deletePreviousToken.mockResolvedValue(undefined);
      mockRefreshTokenService.create.mockResolvedValue(null);

      await expect(service.login({ dto: userLoginDto, ip: '127.0.0.1', userAgent: 'test-agent' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should generate proper JWT tokens', async () => {
      const userLoginDto: UserLoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockRefreshToken = { _id: 'refresh-id', token: 'refresh-token' };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce('access-token');
      mockJwtService.sign.mockReturnValueOnce('refresh-token');
      mockRefreshTokenService.deletePreviousToken.mockResolvedValue(undefined);
      mockRefreshTokenService.create.mockResolvedValue(mockRefreshToken);

      const result = await service.login({ dto: userLoginDto, ip: '127.0.0.1', userAgent: 'test-agent' });

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(1, { sub: mockObjectId });
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(2, { sub: mockObjectId }, {
        secret: 'refresh-secret',
        expiresIn: '7d',
      });
    });
  });
});