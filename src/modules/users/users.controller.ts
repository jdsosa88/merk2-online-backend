import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { User } from './schemas/user.schema';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import {
  DeleteUserPolicyHandler,
  ReadUserPolicyHandler,
  UpdateUserPolicyHandler
} from './policies/users.policy';
import { VerificationCodeDto } from './dto/verification-code.dto';
import {
  ApiChangeForgottenPassword,
  ApiCreate,
  ApiFindOne,
  ApiRemove,
  ApiRequestDeleteVerificationCode,
  ApiSetPassword,
  ApiUpdate
} from './decorators/swagger-users.decorator';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { Types } from 'mongoose';


@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiCreate()
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return new ApiResponseDto("User created, please check your email for the activation code", user);
  }

  @Get()
  @CheckPolicies(new ReadUserPolicyHandler())
  @ApiFindOne()
  async findOne(@AuthUser() user: User): Promise<ApiResponseDto<User>> {
    return new ApiResponseDto(user);
  }

  @Patch()
  @CheckPolicies(new UpdateUserPolicyHandler())
  @ApiUpdate()
  async update(@AuthUser('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto<User>> {
    const user = await this.usersService.update(id, updateUserDto);
    return new ApiResponseDto("User updated", user);
  }

  @Post('/request-delete-code')
  @ApiRequestDeleteVerificationCode()
  @HttpCode(HttpStatus.OK)
  async requestDeleteVerificationCode(@AuthUser() user: User): Promise<ApiResponseDto> {
    const message: string = await this.usersService.createDeleteVerificationCode(user._id, user.email);
    return new ApiResponseDto(message);
  }

  @Delete()
  @CheckPolicies(new DeleteUserPolicyHandler())
  @ApiRemove()
  async remove(@AuthUser('_id') id: Types.ObjectId, @Query() verificationCodeDto: VerificationCodeDto): Promise<ApiResponseDto> {
    const user = await this.usersService.remove(id, verificationCodeDto.code);
    return new ApiResponseDto('User deleted', user);
  }

  @Patch('/set-password')
  @CheckPolicies(new UpdateUserPolicyHandler())
  @ApiSetPassword()
  async setPassword(@AuthUser('id') id: string, @Body() setPasswordDto: SetPasswordDto): Promise<ApiResponseDto> {
    const message = await this.usersService.updatePassword(id, setPasswordDto);
    return new ApiResponseDto(message);
  }

  @Patch('/change-forgotten-password')
  @CheckPolicies(new UpdateUserPolicyHandler())
  @ApiChangeForgottenPassword()
  async changeForgottenPassword(@AuthUser('id') id: string, @Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto> {
    const message = await this.usersService.resetPassword(id, resetPasswordDto);
    return new ApiResponseDto(message);
  }

}
