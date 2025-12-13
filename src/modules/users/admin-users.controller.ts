import { Body, Controller, Delete, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PoliciesGuard } from "src/common/guards/policies.guard";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { CheckPolicies } from "../casl/decorators/policies.decorator";
import { Role, User } from "./schemas/user.schema";
import { UpdateUserDto } from "./dto/update-user.dto"
import { IdDto } from "src/common/dto/id.dto";
import {
  ApiCreateAdmin,
  ApiRemoveOtherUser,
  ApiUpdateOtherUser
} from "./decorators/swagger-users.decorator";
import { CreateUserPolicyHandler } from "./policies/create-user.policy";
import { UpdateOtherUserPolicyHandler } from "./policies/update-user.policy";
import { DeleteOtherUserPolicyHandler } from "./policies/delete-user.policy";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @CheckPolicies(new CreateUserPolicyHandler())
  @ApiCreateAdmin()
  async createAdmin(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<User>> {
    const user: User = await this.usersService.create(createUserDto, Role.ADMIN);
    return new ApiResponseDto("Admin user created successfully", user);
  }

  @Patch()
  @CheckPolicies(new UpdateOtherUserPolicyHandler())
  @ApiUpdateOtherUser()
  async updateOtherUser(@Query() idDto: IdDto, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto<User>> {
    const user: User = await this.usersService.updateOtherUser(idDto.id, updateUserDto);
    return new ApiResponseDto("User updated", user);
  }

  @Delete()
  @CheckPolicies(new DeleteOtherUserPolicyHandler())
  @ApiRemoveOtherUser()
  async removeOtherUser(@Query() idDto: IdDto): Promise<ApiResponseDto> {
    const user: User = await this.usersService.removeOtherUser(idDto.id);
    return new ApiResponseDto('User deleted', user);
  }
}
