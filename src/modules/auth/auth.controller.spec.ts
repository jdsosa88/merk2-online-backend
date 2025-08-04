import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserLoginDto } from './dto/user-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ActivateUserDto } from './dto/activate-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

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
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        } as any,
        tokens: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
        },
      };

      const expectedResponse = new ApiResponseDto('Login completed successfully', mockLoginResponse);
      mockAuthService.login.mockResolvedValue(expectedResponse);

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
      expect(result).toEqual(expectedResponse);
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
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'valid_refresh_token',
      };

      const expectedResponse = new ApiResponseDto('Token refreshed successfully', {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      });

      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(result).toEqual(expectedResponse);
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'invalid_refresh_token',
      };

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'valid_refresh_token',
      };

      const expectedResponse = new ApiResponseDto('Logout successful');
      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(refreshTokenDto);

      expect(authService.logout).toHaveBeenCalledWith(refreshTokenDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('activateUser', () => {
    it('should activate user account successfully', async () => {
      const activateUserDto: ActivateUserDto = {
        id: 'user123',
        code: '123456',
      };

      const expectedResponse = new ApiResponseDto('Account activated successfully');
      mockAuthService.activateUser.mockResolvedValue(expectedResponse);

      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        connection: { remoteAddress: '127.0.0.1' },
      };

      const result = await controller.activateUser(mockRequest, activateUserDto);

      expect(authService.activateUser).toHaveBeenCalledWith(
        activateUserDto,
        '127.0.0.1',
        'test-agent'
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password code successfully', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      const expectedResponse = new ApiResponseDto('Reset code sent successfully');
      mockAuthService.sendResetPasswordCode.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(authService.sendResetPasswordCode).toHaveBeenCalledWith(forgotPasswordDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('verifyresetCode', () => {
    it('should verify reset code successfully', async () => {
      const verifyResetCodeDto: VerifyResetCodeDto = {
        email: 'test@example.com',
        code: '123456',
      };

      const expectedResponse = new ApiResponseDto('Password reset successfully');
      mockAuthService.verifyResetCode.mockResolvedValue(expectedResponse);

      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        connection: { remoteAddress: '127.0.0.1' },
      };

      const result = await controller.resetPassword(mockRequest, verifyResetCodeDto);

      expect(authService.verifyResetCode).toHaveBeenCalledWith(
        verifyResetCodeDto,
        '127.0.0.1',
        'test-agent'
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});