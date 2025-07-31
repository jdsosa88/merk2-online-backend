import { Body, Controller, Delete, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
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


@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Public()
  @UseGuards(ApiKeyGuard)
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto> {
    return await this.usersService.create(createUserDto);
  }

  @Get('/list')  
  async findAll(): Promise<ApiResponseDto> {     
    return await this.usersService.findAll();
  }

  @Get()
  async findOne(@Request() req: any): Promise<ApiResponseDto<User>> {
    return new ApiResponseDto(req.user as User) ;
  }

  @Patch()
  async update(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto> {
    return await this.usersService.update(req.user.id, updateUserDto);
  }

  @Delete()
  async remove(@Request() req: any): Promise<ApiResponseDto> {    
    return await this.usersService.remove(req.user.id);
  }

  @Patch('/set-password')
  async updatePassword( @Request() req: any, @Body() setPasswordDto: SetPasswordDto): Promise<ApiResponseDto> {
    return await this.usersService.updatePassword(req.user.id, setPasswordDto);
  }

  @Patch('/reset-password')
  async resetPassword( @Request() req: any, @Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto> {
    return await this.usersService.resetPassword(req.user.id, resetPasswordDto);
  }

}
