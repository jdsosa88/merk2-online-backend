import { Body, Controller, Delete, Get, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { SetPasswordDto } from '../dto/set-password.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiResponseDto } from 'src/common/dto/response.dto';
import { User } from '../schemas/user.schema';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import {
  DeleteUserPolicyHandler,
  ReadUserPolicyHandler,
  UpdateUserPolicyHandler
} from 'src/modules/casl/policy-handlers/user.policy-handler';
import { VerificationCodeDto } from '../dto/verification-code.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SwaggerResponseUtils } from 'src/common/utils/swagger-response-utils';


@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Create a new user with CUSTOMER role' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: ApiResponseDto<User>,
    example: new SwaggerResponseUtils().getExampleResponseWithUser(
      'User created, please check your email for the activation code'
    ),
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto> {
    const user: User = await this.usersService.create(createUserDto);
    return new ApiResponseDto("User created, please check your email for the activation code", user);
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User obtained',
    type: ApiResponseDto<User>,
    example: new SwaggerResponseUtils().getExampleResponseWithUser(),
  })
  @CheckPolicies(new ReadUserPolicyHandler())
  async findOne(@Request() req: any): Promise<ApiResponseDto<User>> {
    return new ApiResponseDto(req.user as User);
  }

  @Patch()
  @ApiOperation({
    summary: 'Updates the authenticated user except for the isActive, password and role fields'
  })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: ApiResponseDto<User>,
    example: new SwaggerResponseUtils().getExampleResponseWithUser('User updated'),
  })
  @CheckPolicies(new UpdateUserPolicyHandler())
  async update(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto<User>> {
    const user: User =  await this.usersService.update(req.user.id, updateUserDto);
    return new ApiResponseDto("User updated", user);
  }

  @Post('/request-delete-code')
  @ApiOperation({
    summary: 'Send a requested delete code to the authenticated user email'
  })
  @ApiResponse({
    status: 200,
    description: 'Code sended to user email',
    type: ApiResponseDto<User>,
    example: new ApiResponseDto("A delete code has been sent to your email"),
  })
  async requestDeleteVerificationCode(@Request() req: any): Promise<ApiResponseDto> {
    const message: string = await this.usersService.createDeleteVerificationCode(req.user.id, req.user.email);
    return new ApiResponseDto(message);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete the authenticated user sending the requested delete code by query'
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    type: ApiResponseDto<User>,
    example: new SwaggerResponseUtils().getExampleResponseWithUser('User deleted'),
  })
  @CheckPolicies(new DeleteUserPolicyHandler())
  async remove(@Request() req: any, @Query() verificationCodeDto: VerificationCodeDto): Promise<ApiResponseDto> {
    const user: User = await this.usersService.remove(req.user.id, verificationCodeDto.code);
    return new ApiResponseDto('User deleted', user);
  }

  @Patch('/set-password')
  @ApiOperation({
    summary: 'Set the authenticated user password sending the old and new password by body'
  })
  @ApiResponse({
    status: 200,
    description: 'Code sended to user email',
    type: ApiResponseDto<User>,
    example: new ApiResponseDto("Password changed successfully"),
  })
  @CheckPolicies(new UpdateUserPolicyHandler())
  async setPassword(@Request() req: any, @Body() setPasswordDto: SetPasswordDto): Promise<ApiResponseDto> {
    const message: string = await this.usersService.updatePassword(req.user.id, setPasswordDto);
    return new ApiResponseDto(message);
  }

  @Patch('/change-forgotten-password')
  @ApiOperation({
    summary: 'Reset the forgotten password to the authenticated user sending the requested reset password code and the new password by body'
  })
  @ApiResponse({
    status: 200,
    description: 'Code sended to user email',
    type: ApiResponseDto<User>,
    example: new ApiResponseDto("Password changed successfully"),
  })
  @CheckPolicies(new UpdateUserPolicyHandler())
  async changeForgottenPassword(@Request() req: any, @Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto> {
    const message: string = await this.usersService.resetPassword(req.user.id, resetPasswordDto);
    return new ApiResponseDto(message);
  }

}
