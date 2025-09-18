import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards, ValidationPipe } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PoliciesGuard } from "src/common/guards/policies.guard";
import { UsersService } from "../services/users.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { ApiResponseDto } from "src/common/dto/response.dto";
import { CheckPolicies } from "../../casl/decorators/policies.decorator";
import { Role, User, UserDocument } from "../schemas/user.schema";
import { UpdateUserDto } from "../dto/update-user.dto";
import { CreateAdminUserPolicyHandler, DeleteOtherUserPolicyHandler, ListUsersPolicyHandler, ReadOtherUserPolicyHandler, UpdateOtherUserPolicyHandler, } from "../../casl/policy-handlers/user.policy-handler";
import { IdDto } from "src/common/dto/id.dto";
import { ListUsersQueryDto } from "../dto/list-users-query.dto";
import { PaginatedListDto } from "src/common/dto/paginated-list.dto";
import { ApiCreateAdmin, ApiFindAll, ApiFindOtherUser, ApiRemoveOtherUser, ApiUpdateOtherUser } from "../decorators/swagger-users.decorator";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @CheckPolicies(new CreateAdminUserPolicyHandler())
  @ApiCreateAdmin()
  async createAdmin(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<UserDocument>> {
    const user: UserDocument = await this.usersService.create(createUserDto, Role.ADMIN);
    return new ApiResponseDto("Admin user created successfully", user);
  }
  @Get()
  @CheckPolicies(new ReadOtherUserPolicyHandler())
  @ApiFindOtherUser()
  async findOtherUser(@Query() idDto: IdDto): Promise<ApiResponseDto<UserDocument>> {
    const user: UserDocument = await this.usersService.findOne(idDto.id);
    return new ApiResponseDto(user);
  }

  @Get('/list')
  @CheckPolicies(new ListUsersPolicyHandler())
  @ApiFindAll()
  async findAll(@Query(new ValidationPipe({ transform: true })) query: ListUsersQueryDto,): Promise<ApiResponseDto<PaginatedListDto<UserDocument>>> {
    const paginatedList: PaginatedListDto<UserDocument> = await this.usersService.findAllPaginated(query);
    return new ApiResponseDto(paginatedList);
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
