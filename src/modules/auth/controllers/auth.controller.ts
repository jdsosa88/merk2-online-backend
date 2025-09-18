import { Body, Controller, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserLoginDto } from '../dto/user-login.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/dto/response.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyResetCodeDto } from '../dto/verify-reset-code.dto';
import { VerifyDefaultCodeUserDto } from '../dto/verify-default-code-user.dto';
import { ApiHeader, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse } from '@nestjs/swagger';
import { SwaggerResponseUtils } from 'src/common/utils/swagger-response-utils';
import { LoginResponseDto } from '../dto/login-response.dto';
import { AuthTokensDto } from '../dto/atuh-tokens.dto';
import { ApiConfirmAccountActivationCode, ApiConfirmForgottenPasswordCode, ApiForgotPassword, ApiLogin, ApiLogout, ApiRefreshToken } from '../decorators/swagger-auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @UseGuards(ApiKeyGuard)
  @ApiLogin()
  async login(@Request() req: any, @Body() userLoginDto: UserLoginDto): Promise<ApiResponseDto<LoginResponseDto>> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const loginResponse: LoginResponseDto = await this.authService.login(userLoginDto, ip, userAgent);
    return new ApiResponseDto("Login completed successfully", loginResponse);
  }

  @Post('refresh-token')
  @UseGuards(ApiKeyGuard)
  @ApiRefreshToken()
  async refreshToken(@Headers('x-token') token: string): Promise<ApiResponseDto<AuthTokensDto>> {
    const authTokens: AuthTokensDto = await this.authService.refreshToken(token);
    return new ApiResponseDto('Token refreshed successfully', authTokens);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiLogout()
  async logout(@Headers('x-token') token: string): Promise<ApiResponseDto> {
    const message: string = await this.authService.logout(token);
    return new ApiResponseDto(message);
  }

  @Post('/confirm-account-activation-code')
  @UseGuards(ApiKeyGuard)
  @ApiConfirmAccountActivationCode()
  async confirmAccountActivationCode(@Request() req: any, @Body() activateUserDto: VerifyDefaultCodeUserDto): Promise<ApiResponseDto> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const loginResponse: LoginResponseDto = await this.authService.activateUser(activateUserDto, ip, userAgent);
    return new ApiResponseDto("Account activated successfully", loginResponse);
  }

  @Post('/forgot-password')
  @UseGuards(ApiKeyGuard)
  @ApiForgotPassword()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponseDto> {
    const message: string = await this.authService.sendResetPasswordCode(forgotPasswordDto);
    return new ApiResponseDto(message);
  }

  @Post('/confirm-forgotten-password-code')
  @UseGuards(ApiKeyGuard)
  @ApiConfirmForgottenPasswordCode()
  async confirmForgottenPasswordCode(@Request() req: any, @Body() verifyResetCodeDto: VerifyResetCodeDto): Promise<ApiResponseDto<LoginResponseDto>> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const loginResponse: LoginResponseDto = await this.authService.verifyResetCode(verifyResetCodeDto, ip, userAgent);
    return new ApiResponseDto('Password reset code is valid', loginResponse);
  }

}
