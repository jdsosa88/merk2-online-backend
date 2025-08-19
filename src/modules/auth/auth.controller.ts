import { Body, Controller, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/dto/response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { VerifyDefaultCodeUserDto } from './dto/verify-default-code-user.dto';

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
  async refresh(@Headers('x-token') token: string): Promise<ApiResponseDto> {
    return await this.authService.refreshToken(token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Headers('x-token') token: string): Promise<ApiResponseDto> {
    return await this.authService.logout(token);

  }

  @Post('/activate-account')
  @UseGuards(ApiKeyGuard)
  async activateUser(@Request() req: any, @Body() activateUserDto: VerifyDefaultCodeUserDto): Promise<ApiResponseDto> {
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
