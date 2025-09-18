import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UserLoginDto } from '../dto/user-login.dto';
import { VerifyDefaultCodeUserDto } from '../dto/verify-default-code-user.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyResetCodeDto } from '../dto/verify-reset-code.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UnauthorizedException } from '@nestjs/common';
import { AuthTokensDto } from '../dto/atuh-tokens.dto';
import { Types } from 'mongoose';
import { UserRole } from 'src/modules/users/schemas/user.schema';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockObjectId = new Types.ObjectId();

  const mockUser = {
    id: mockObjectId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    role: 'CUSTOMER' as UserRole,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockAuthService = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    activateUser: jest.fn(),
    sendResetPasswordCode: jest.fn(),
    verifyResetCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const userLoginDto: UserLoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockLoginResponse: LoginResponseDto = {
        user: mockUser,
        tokens: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
        },
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        connection: { remoteAddress: '127.0.0.1' },
      };

      const result = await controller.login(mockRequest, userLoginDto);

      expect(authService.login).toHaveBeenCalledWith(
        userLoginDto,
        '127.0.0.1',
        'test-agent'
      );
      expect(result.message).toEqual('Login completed successfully');
      expect(result.data).toEqual(mockLoginResponse);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const userLoginDto: UserLoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        connection: { remoteAddress: '127.0.0.1' },
      };

      await expect(controller.login(mockRequest, userLoginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const token: string = 'valid_refresh_token';

      const mockAuthTokens: AuthTokensDto = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockAuthTokens);

      const result = await controller.refreshToken(token);

      expect(authService.refreshToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(result.message).toEqual('Token refreshed successfully');
      expect(result.data).toEqual(mockAuthTokens);
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      const token: string = 'invalid_refresh_token';

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(controller.refreshToken(token)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const token: string = 'valid_refresh_token';
      
      mockAuthService.logout.mockResolvedValue('Logout successful');

      const result = await controller.logout(token);

      expect(authService.logout).toHaveBeenCalledWith(token);
      expect(result.message).toEqual('Logout successful');
      expect(result.data).toBeUndefined();
    });
  });

  describe('confirmAccountActivationCode', () => {
    it('should activate user account successfully', async () => {
      const verifyDefaultCodeDto: VerifyDefaultCodeUserDto = {
        id: 'user123',
        code: '123456',
      };

      const mockLoginResponse: LoginResponseDto = {
        user: mockUser,
        tokens: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
        },
      };

      mockAuthService.activateUser.mockResolvedValue(mockLoginResponse);

      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        connection: { remoteAddress: '127.0.0.1' },
      };

      const result = await controller.confirmAccountActivationCode(mockRequest, verifyDefaultCodeDto);

      expect(authService.activateUser).toHaveBeenCalledWith(
        verifyDefaultCodeDto,
        '127.0.0.1',
        'test-agent'
      );
      expect(result.message).toEqual('Account activated successfully');
      expect(result.data).toBe(mockLoginResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password code successfully', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      mockAuthService.sendResetPasswordCode.mockResolvedValue('A reset password code has been sent to your email');

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(authService.sendResetPasswordCode).toHaveBeenCalledWith(forgotPasswordDto);
      expect(result.message).toEqual('A reset password code has been sent to your email');
      expect(result.data).toBeUndefined();
    });
  });

  describe('confirm-forgotten-password-code', () => {
    it('should verify reset code successfully', async () => {
      const verifyResetCodeDto: VerifyResetCodeDto = {
        email: 'test@example.com',
        code: '123456',
      };

      const mockLoginResponse: LoginResponseDto = {
        user: mockUser,
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        }
      }

      mockAuthService.verifyResetCode.mockResolvedValue(mockLoginResponse);

      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        connection: { remoteAddress: '127.0.0.1' },
      };

      const result = await controller.confirmForgottenPasswordCode(mockRequest, verifyResetCodeDto);

      expect(authService.verifyResetCode).toHaveBeenCalledWith(
        verifyResetCodeDto,
        '127.0.0.1',
        'test-agent'
      );
      expect(result.message).toEqual('Password reset code is valid');
      expect(result.data).toBe(mockLoginResponse);
    });
  });
});