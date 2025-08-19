import { Body, Controller, Delete, Get, Patch, Post, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiResponseDto } from 'src/common/dto/response.dto';
import { User } from './user.schema';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/policies.decorator';
import { 
  DeleteUserPolicyHandler, 
  ReadUserPolicyHandler,   
  UpdateUserPolicyHandler 
} from 'src/modules/casl/policy-handlers/user.policy-handler';
import { VerificationCodeDto } from './dto/verification-code.dto';


@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Public()
  @UseGuards(ApiKeyGuard)
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto> {
    return await this.usersService.create(createUserDto);
  }

  

  @Get()
  @CheckPolicies(new ReadUserPolicyHandler())
  async findOne(@Request() req: any): Promise<ApiResponseDto<User>> {
    return new ApiResponseDto(req.user as User) ;
  }

  @Patch()
  @CheckPolicies(new UpdateUserPolicyHandler())
  async update(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto> {
    return await this.usersService.update(req.user.id, updateUserDto);
  }

  @Post('/request-delete-code') 
  async requestDeleteVerificationCode(@Request() req: any){
    return await this.usersService.createDeleteVerificationCode(req.user.id, req.user.email);
  }

  @Delete()
  @CheckPolicies(new DeleteUserPolicyHandler())
  async remove(@Request() req: any, @Query() verificationCodeDto: VerificationCodeDto): Promise<ApiResponseDto> {    
    return await this.usersService.remove(req.user.id, verificationCodeDto.code);
  }

  @Patch('/set-password')
  @CheckPolicies(new UpdateUserPolicyHandler())
  async updatePassword( @Request() req: any, @Body() setPasswordDto: SetPasswordDto): Promise<ApiResponseDto> {
    return await this.usersService.updatePassword(req.user.id, setPasswordDto);
  }

  @Patch('/reset-password')
  @CheckPolicies(new UpdateUserPolicyHandler())
  async resetPassword( @Request() req: any, @Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto> {
    return await this.usersService.resetPassword(req.user.id, resetPasswordDto);
  }

}
