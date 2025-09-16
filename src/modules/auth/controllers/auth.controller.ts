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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({
    summary: 'Login into the API as an authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'User login response',
    type: ApiResponseDto,
    example: new SwaggerResponseUtils().getResponseWithLoginResponse('Login completed successfully'),
  })
  @UseGuards(ApiKeyGuard)
  async login(@Request() req: any, @Body() userLoginDto: UserLoginDto): Promise<ApiResponseDto<LoginResponseDto>> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const loginResponse: LoginResponseDto = await this.authService.login(userLoginDto, ip, userAgent);
    return new ApiResponseDto("Login completed successfully", loginResponse);
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh the expired jwt bearer token when it is expired by passing the refresh jwt token as x-token by header'
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: ApiResponseDto,
    example: new SwaggerResponseUtils().getResponseWithLoginResponse('Token refreshed', false),
  })
  @UseGuards(ApiKeyGuard)
  async refresh(@Headers('x-token') token: string): Promise<ApiResponseDto<AuthTokensDto>> {
    const authTokens: AuthTokensDto = await this.authService.refreshToken(token);
    return new ApiResponseDto('Token refreshed successfully', authTokens);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout of the api by deleting the refresh token saved on database'
  })
  @ApiResponse({
    status: 200,
    description: 'User logout',
    type: ApiResponseDto,
    example: new ApiResponseDto('Logout successful'),
  })
  @UseGuards(JwtAuthGuard)
  async logout(@Headers('x-token') token: string): Promise<ApiResponseDto> {
    const message: string = await this.authService.logout(token);
    return new ApiResponseDto(message);
  }

  @Post('/confirm-account-activation-code')
  @ApiOperation({
    summary: 'Activate the user and make the API login by passing the id and the activation code by body.'
  })
  @ApiResponse({
    status: 200,
    description: 'User activated and login',
    type: ApiResponseDto,
    example: new SwaggerResponseUtils().getResponseWithLoginResponse('Account activated successfully'),
  })
  @UseGuards(ApiKeyGuard)
  async confirmAccountActivationCode(@Request() req: any, @Body() activateUserDto: VerifyDefaultCodeUserDto): Promise<ApiResponseDto> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const loginResponse: LoginResponseDto = await this.authService.activateUser(activateUserDto, ip, userAgent);
    return new ApiResponseDto("Account activated successfully", loginResponse);
  }

  @Post('/forgot-password')
  @ApiOperation({
    summary: 'Get a verification code for forgotten password by passing the registered user email'
  })
  @ApiResponse({
    status: 200,
    description: 'User verification code sended',
    type: ApiResponseDto,
    example: new ApiResponseDto("A reset password code has been sent to your email"),
  })
  @UseGuards(ApiKeyGuard)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponseDto> {
    const message: string = await this.authService.sendResetPasswordCode(forgotPasswordDto);
    return new ApiResponseDto(message);
  }

  @Post('/confirm-forgotten-password-code')
  @ApiOperation({
    summary: 'Confirm the forgotten password code and make the API login by passing the email and the verification code by body. The operation is completed on /users/change-forgotten-password by changing the forgotten authenticated user password.'
  })
  @ApiResponse({
    status: 200,
    description: 'Verification code verified and login',
    type: ApiResponseDto,
    example: new SwaggerResponseUtils().getResponseWithLoginResponse('Password reset code is valid'),
  })
  @UseGuards(ApiKeyGuard)
  async confirmForgottenPasswordCode(@Request() req: any, @Body() verifyResetCodeDto: VerifyResetCodeDto): Promise<ApiResponseDto<LoginResponseDto>> {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const loginResponse: LoginResponseDto = await this.authService.verifyResetCode(verifyResetCodeDto, ip, userAgent);
    return new ApiResponseDto('Password reset code is valid', loginResponse);
  }

}
