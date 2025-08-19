import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PoliciesGuard } from "src/common/guards/policies.guard";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ApiResponseDto } from "src/common/dto/response.dto";
import { CheckPolicies } from "../casl/policies.decorator";
import { Role, User } from "./user.schema";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateAdminUserPolicyHandler, DeleteOtherUserPolicyHandler, ListUsersPolicyHandler, ReadOtherUserPolicyHandler, UpdateOtherUserPolicyHandler,  } from "../casl/policy-handlers/user.policy-handler";
import { IdDto } from "src/common/dto/id.dto";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @CheckPolicies(new CreateAdminUserPolicyHandler())  
  async createAdmin(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto> {
    return await this.usersService.create(createUserDto, Role.ADMIN);
  }
  @Get()
  @CheckPolicies(new ReadOtherUserPolicyHandler())
  async findOtherUser(@Query() idDto: IdDto): Promise<ApiResponseDto<User>> {
    return new ApiResponseDto(await this.usersService.findOne(idDto.id)) ;
  }

  @Get('/list')
    @CheckPolicies(new ListUsersPolicyHandler())
    async findAll(): Promise<ApiResponseDto> {     
      return await this.usersService.findAll();
    }

  @Patch()
  @CheckPolicies(new UpdateOtherUserPolicyHandler())
  async updateOtherUser(@Query() idDto: IdDto, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto> {
    return await this.usersService.updateOtherUser(idDto.id, updateUserDto);
  }

  @Delete()
  @CheckPolicies(new DeleteOtherUserPolicyHandler())
  async removeOtherUser(@Query() idDto: IdDto): Promise<ApiResponseDto> {    
    return await this.usersService.removeOtherUser(idDto.id);
  }
}
