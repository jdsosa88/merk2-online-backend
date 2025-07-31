import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/dto/response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthTokensDto } from './dto/atuh-tokens.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ActivateUserDto } from './dto/activate-user.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @UseGuards(ApiKeyGuard)
  async login(@Request() req: any, @Body() userLoginDto: UserLoginDto): Promise<ApiResponseDto> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.authService.login(userLoginDto, ip, userAgent);
  }

  @Post('refresh-token')
  @UseGuards(ApiKeyGuard)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<ApiResponseDto> {
    return await this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() refreshToken: RefreshTokenDto): Promise<ApiResponseDto> {
    return await this.authService.logout(refreshToken);

  }

  @Post('/activate-account')
  @UseGuards(ApiKeyGuard)
  async activateUser(@Request() req: any, @Body() activateUserDto: ActivateUserDto): Promise<ApiResponseDto> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.authService.activateUser(activateUserDto, ip, userAgent);
  }

  @Post('/forgot-password')
  @UseGuards(ApiKeyGuard)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponseDto> {
    return await this.authService.sendResetPasswordCode(forgotPasswordDto);
  }

  @Post('/verify-reset-code')
  @UseGuards(ApiKeyGuard)
  async resetPassword(@Request() req: any, @Body() verifyResetCodeDto: VerifyResetCodeDto): Promise<ApiResponseDto> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.authService.verifyResetCode(verifyResetCodeDto, ip, userAgent);
  }

}
