import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserLoginDto } from './dto/user-login.dto';
import { User } from '../users/schemas/user.schema';
import { AuthTokensDto } from './dto/atuh-tokens.dto';
import { RefreshTokenService } from './refresh-token.service';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './schemas/refresh-token.schema';
import ms = require('ms');
import { LoginResponseDto } from './dto/login-response.dto';
import { Types } from 'mongoose';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { VerifyDefaultCodeUserDto } from './dto/verify-default-code-user.dto';
import { ICreateRefreshToken, IRefreshToken } from './types/refresh-token.interface';
import { AtuthParams, GoogleAuthParams, LoginParams } from './types/auth.interface';
import { GoogleAuthService } from './google-auth.service';
import { ICreateUser } from '../users/types/users.interface';
import { Role } from '../users/types/users.type';
import { generateRandomPassword } from 'src/common/utils/random-utils';


@Injectable()
export class AuthService {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly mailerService: MailerService,
    private googleAuthService: GoogleAuthService,
  ) { }

  async login(authParams: AtuthParams<UserLoginDto>): Promise<LoginResponseDto> {
    try {
      const { dto: userLoginDto, ip, userAgent } = authParams;
      const user = await this.validateUser(userLoginDto);
      return await this.makeLogin({ user, ip, userAgent });
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokensDto> {
    try {
      const payload = await this.verifyJwtRefreshToken(refreshToken);

      const storedToken: RefreshToken | null = await this.refreshTokenService.findByToken(refreshToken);
      if (!storedToken) throw new UnauthorizedException('Refresh token not found');

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');

      const authTokens: AuthTokensDto = await this.generateAuthTokens(user._id);
      const refreshTokenData: IRefreshToken = {
        userId: user._id,
        token: authTokens.refresh_token,
        ip: storedToken.ip,
        userAgent: storedToken.userAgent
      };
      const savedRefreshToken = await this.saveRefreshToken(refreshTokenData);
      if (!savedRefreshToken) throw new BadRequestException("Refresh token could not be saved");

      return authTokens;
    } catch (error) {
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<string> {
    try {
      await this.refreshTokenService.delete(refreshToken);
      return 'Logout successful';
    } catch (error) {
      throw error;
    }
  }

  async activateUser(authParams: AtuthParams<VerifyDefaultCodeUserDto>): Promise<LoginResponseDto> {
    try {
      const { dto: verifyResetCodeDto, ip, userAgent } = authParams;
      let user = await this.usersService.findOne(verifyResetCodeDto.id);
      if (!user) throw new NotFoundException('User not found');
      if (user.isActive) throw new BadRequestException('The user is already active');

      const isVerifiedCode: boolean = await this.verificationCodeService.verifyCode(
        user._id,
        verifyResetCodeDto.code,
        'activation'
      );
      if (!isVerifiedCode) throw new BadRequestException('Invalid or expired activation code');

      user.isActive = true;
      user = await this.usersService.update(verifyResetCodeDto.id, user);

      return await this.makeLogin({ user, ip, userAgent });
    } catch (error) {
      throw error;
    }
  }

  async sendResetPasswordCode(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    try {
      const user = await this.usersService.findByEmail(forgotPasswordDto.email, false);
      if (!user) throw new NotFoundException(`User not found`);
      if (!user.isActive) throw new UnauthorizedException(`User is not active`);
      const verificationTimeInHours = this.configService.get<number>('verificationCode.expiresHours') || 3;
      const code = await this.verificationCodeService.createCode(
        user._id,
        'reset_password',
        verificationTimeInHours
      );
      await this.sendResetPasswordEmail(user.email, code.code);

      return "A reset password code has been sent to your email";
    } catch (error) {
      throw error;
    }
  }

  async verifyResetCode(authParams: AtuthParams<VerifyResetCodeDto>): Promise<LoginResponseDto> {
    try {
      const { dto: verifyResetCodeDto, ip, userAgent } = authParams;
      const user = await this.usersService.findByEmail(authParams.dto.email, false);
      if (!user) throw new NotFoundException(`User with email not found`);
      if (!user.isActive) throw new UnauthorizedException(`User with email is not active`);

      const isResetCode = await this.verificationCodeService.verifyCode(
        user._id,
        verifyResetCodeDto.code,
        'verify_reset_password'
      );
      if (!isResetCode) throw new BadRequestException('Invalid or expired reset password code');

      return await this.makeLogin({ user, ip, userAgent });
    } catch (error) {
      throw error;
    }
  }

  async googleAuth(authParams: GoogleAuthParams): Promise<LoginResponseDto> {
    try {
      const { googleToken, ip, userAgent } = authParams;
      const googleUser = await this.googleAuthService.validateGoogleToken(googleToken);

      if (!googleUser.email) throw new BadRequestException("Google user email not found");
      let user = await this.usersService.findByEmail(googleUser.email);

      if (!user) {
        const newUserData: ICreateUser = {
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          email: googleUser.email,
          googleId: googleUser.googleId,
          isActive: true,
          isPhoneVerified: false,
          password: generateRandomPassword(),
          role: Role.CUSTOMER,
          avatar: googleUser?.picture ? { url: googleUser.picture} : undefined,
        };
        console.log({ newUserData });

        user = await this.usersService.createGoogleUser(newUserData);
      } else if (!user.googleId) {
        user = await this.usersService.linkGoogleAccount(user._id, googleUser.googleId);
      }
      console.log({ user });
      const loginResponse = await this.makeLogin({ user, ip, userAgent });
      console.log({ loginResponse });

      return loginResponse;
    } catch (error) {
      throw error;
    }
  }

  private async validateUser(userLoginDto: UserLoginDto): Promise<User> {
    const { email, password } = userLoginDto;
    const user = await this.usersService.findByEmail(email);

    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  private async makeLogin(loginParams: LoginParams): Promise<LoginResponseDto> {
    const { user, ip, userAgent } = loginParams;
    if (!user.isActive) throw new UnauthorizedException('User is not active');
    const userId: Types.ObjectId = user._id;
    const authTokens: AuthTokensDto = await this.generateAuthTokens(userId);
    const refreshTokenData: IRefreshToken = {
      token: authTokens.refresh_token,
      userId,
      ip,
      userAgent
    }
    const savedRefreshToken = await this.saveRefreshToken(refreshTokenData);
    if (!savedRefreshToken) throw new BadRequestException("Refresh token could not be saved");
    return { user, tokens: authTokens };
  }

  private async verifyJwtRefreshToken(refreshToken: string): Promise<any> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('auth.jwt.refreshSecret'),
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
    return { access_token: newAccessToken, refresh_token: newRefreshToken };

  }

  private async generateRefreshToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('auth.jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('auth.jwt.refreshExpiration'),
    });
  }

  private async saveRefreshToken(refreshTokenData: IRefreshToken): Promise<RefreshToken> {
    await this.refreshTokenService.deletePreviousToken(refreshTokenData);
    const expiration = this.configService.get('auth.jwt.refreshExpiration');
    const expiresAt = new Date(Date.now() + ms(expiration));
    const refreshTokenDto: ICreateRefreshToken = {
      userId: refreshTokenData.userId,
      token: refreshTokenData.token,
      ip: refreshTokenData.ip,
      userAgent: refreshTokenData.userAgent,
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



