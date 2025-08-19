import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserLoginDto } from './dto/user-login.dto';
import { ApiResponseDto } from 'src/common/dto/response.dto';
import { User } from '../users/user.schema';
import { AuthTokensDto } from './dto/atuh-tokens.dto';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './refresh-token/refresh-token.schema';
import ms = require('ms');
import { LoginResponseDto } from './dto/login-response.dto';
import { Types } from 'mongoose';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { VerifyDefaultCodeUserDto } from './dto/verify-default-code-user.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly mailerService: MailerService,
  ) { }

  async login(userLoginDto: UserLoginDto, ip: string, userAgent: string): Promise<ApiResponseDto<LoginResponseDto>> {
    try {
      const user = await this.validateUser(userLoginDto);
      const loginResponse: LoginResponseDto = await this.makeLogin(user, ip, userAgent);
      return new ApiResponseDto("Login completed successfully", loginResponse);
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponseDto<AuthTokensDto>> {
    try {
      const payload = await this.verifyJwtRefreshToken(refreshToken);

      const storedToken = await this.refreshTokenService.findByToken(refreshToken);
      if (!storedToken) throw new UnauthorizedException('Refresh token not found');

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');

      const authTokens: AuthTokensDto = await this.generateAuthTokens(user._id as Types.ObjectId);

      const savedRefreshToken = await this.saveRefreshToken(
        authTokens.refresh_token,
        user._id as Types.ObjectId,
        storedToken.ip,
        storedToken.userAgent
      );
      if (!savedRefreshToken) throw new BadRequestException("Refresh token could not be saved");

      return new ApiResponseDto('Token refreshed', authTokens);
    } catch (error) {
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<ApiResponseDto> {
    try {
      await this.refreshTokenService.delete(refreshToken);
      return new ApiResponseDto('Logout successful');
    } catch (error) {
      throw error;
    }
  }

  async activateUser(verifyDefaultCodeDto: VerifyDefaultCodeUserDto, ip: string, userAgent: string): Promise<ApiResponseDto<LoginResponseDto>> {
    try {
      const user = await this.usersService.findOne(verifyDefaultCodeDto.id);
      if (!user) throw new NotFoundException('User not found');
      if (user.isActive) throw new BadRequestException('The user is already active');

      const isVerifiedCode = await this.verificationCodeService.verifyCode(
        user._id as Types.ObjectId,
        verifyDefaultCodeDto.code,
        'activation'
      );
      if (!isVerifiedCode) throw new BadRequestException('Invalid or expired activation code');

      user.isActive = true;
      user.save();

      const loginResponse: LoginResponseDto = await this.makeLogin(user, ip, userAgent);
      return new ApiResponseDto("User activation successful", loginResponse);
    } catch (error) {
      throw error;
    }
  }

  async sendResetPasswordCode(forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponseDto> {
    try {
      const user = await this.usersService.findByEmail(forgotPasswordDto.email, false);
      if (!user) throw new NotFoundException(`User not found`);
      if (!user.isActive) throw new UnauthorizedException(`User is not active`);
      if (user) {
        const code = await this.verificationCodeService.createCode(
          user._id as Types.ObjectId,
          'reset_password',
          3
        );
        await this.sendResetPasswordEmail(user.email, code.code);
      }
      return new ApiResponseDto("A reset code has been sent to your email");
    } catch (error) {
      throw error;
    }
  }

  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto, ip: string, userAgent: string): Promise<ApiResponseDto<LoginResponseDto>> {
    try {
      const user = await this.usersService.findByEmail(verifyResetCodeDto.email, false);
      if (!user) throw new NotFoundException(`User with email not found`);
      if (!user.isActive) throw new UnauthorizedException(`User with email is not active`);

      const isResetCode = await this.verificationCodeService.verifyCode(
        user._id as Types.ObjectId,
        verifyResetCodeDto.code,
        'verify_reset_password'
      );
      if (!isResetCode) throw new BadRequestException('Invalid or expired reset password code');

      const loginResponse: LoginResponseDto = await this.makeLogin(user, ip, userAgent);

      return new ApiResponseDto('Password reset code is valid', loginResponse);
    } catch (error) {
      throw error;
    }
  }

  private async makeLogin(user: User, ip: string, userAgent: string): Promise<LoginResponseDto> {
    if (!user.isActive) throw new UnauthorizedException('User is not active');
    const userId: Types.ObjectId = user._id as Types.ObjectId;
    const authTokens = await this.generateAuthTokens(userId);

    const savedRefreshToken = await this.saveRefreshToken(
      authTokens.refresh_token,
      userId,
      ip,
      userAgent
    );
    if (!savedRefreshToken) throw new BadRequestException("Refresh token could not be saved");
    return new LoginResponseDto(user, authTokens);
  }

  private async validateUser(userLoginDto: UserLoginDto): Promise<User> {
    const { email, password } = userLoginDto;
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  private async verifyJwtRefreshToken(refreshToken: string): Promise<any> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload;
  }

  private async generateAuthTokens(userId: Types.ObjectId): Promise<AuthTokensDto> {
    const newPayload = { sub: userId };
    const newAccessToken: string = this.jwtService.sign(newPayload);
    const newRefreshToken: string = await this.generateRefreshToken(newPayload);
    return new AuthTokensDto(newAccessToken, newRefreshToken);

  }

  private async generateRefreshToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });
  }

  private async saveRefreshToken(refreshToken: string, userId: Types.ObjectId, ip?: string, userAgent?: string): Promise<RefreshToken> {
    await this.refreshTokenService.deletePreviousToken(refreshToken, userId, ip, userAgent);
    const expiration = this.configService.get('JWT_REFRESH_EXPIRATION') || '30d';
    const expiresAt = new Date(Date.now() + ms(expiration));
    const refreshTokenDto = {
      userId: userId,
      token: refreshToken,
      ip,
      userAgent,
      expiresAt,
    };
    return this.refreshTokenService.create(refreshTokenDto);
  }

  private async sendResetPasswordEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Password Code',
      text: `Your reset password code is: ${code}`,
      html: `<p>Your reset password code is: <b>${code}</b></p>`,
    });
  }

}



