import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
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
import { ApiChangeForgottenPassword, ApiCreate, ApiFindOne, ApiRemove, ApiRequestDeleteVerificationCode, ApiSetPassword, ApiUpdate } from '../decorators/swagger-users.decorator';


@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiCreate()
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto> {
    const user: User = await this.usersService.create(createUserDto);
    return new ApiResponseDto("User created, please check your email for the activation code", user);
  }

  @Get()
  @CheckPolicies(new ReadUserPolicyHandler())
  @ApiFindOne()
  async findOne(@Request() req: any): Promise<ApiResponseDto<User>> {
    return new ApiResponseDto(req.user as User);
  }

  @Patch()
  @CheckPolicies(new UpdateUserPolicyHandler())
  @ApiUpdate()
  async update(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto<User>> {
    const user: User = await this.usersService.update(req.user.id, updateUserDto);
    return new ApiResponseDto("User updated", user);
  }

  @Post('/request-delete-code')
  @ApiRequestDeleteVerificationCode()
  @HttpCode(HttpStatus.OK)
  async requestDeleteVerificationCode(@Request() req: any): Promise<ApiResponseDto> {
    const message: string = await this.usersService.createDeleteVerificationCode(req.user.id, req.user.email);
    return new ApiResponseDto(message);
  }

  @Delete()
  @CheckPolicies(new DeleteUserPolicyHandler())
  @ApiRemove()
  async remove(@Request() req: any, @Query() verificationCodeDto: VerificationCodeDto): Promise<ApiResponseDto> {
    const user: User = await this.usersService.remove(req.user.id, verificationCodeDto.code);
    return new ApiResponseDto('User deleted', user);
  }

  @Patch('/set-password')
  @CheckPolicies(new UpdateUserPolicyHandler())
  @ApiSetPassword()
  async setPassword(@Request() req: any, @Body() setPasswordDto: SetPasswordDto): Promise<ApiResponseDto> {
    const message: string = await this.usersService.updatePassword(req.user.id, setPasswordDto);
    return new ApiResponseDto(message);
  }

  @Patch('/change-forgotten-password')
  @CheckPolicies(new UpdateUserPolicyHandler())
  @ApiChangeForgottenPassword()
  async changeForgottenPassword(@Request() req: any, @Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto> {
    const message: string = await this.usersService.resetPassword(req.user.id, resetPasswordDto);
    return new ApiResponseDto(message);
  }

}
