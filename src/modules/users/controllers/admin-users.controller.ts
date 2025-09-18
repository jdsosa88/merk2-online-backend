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
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";
import { PaginatedListDto } from "src/common/dto/paginated-list.dto";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new admin user (only an authenticated admin user can access the endpoint)' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: ApiResponseDto<UserDocument>,
    example: new SwaggerResponseUtils().getExampleResponseWithUser(
      'Admin user created successfully', Role.ADMIN, true
    ),
  })
  @CheckPolicies(new CreateAdminUserPolicyHandler())
  async createAdmin(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<UserDocument>> {
    const user: UserDocument = await this.usersService.create(createUserDto, Role.ADMIN);
    return new ApiResponseDto("Admin user created successfully", user);
  }
  @Get()
  @ApiOperation({ summary: 'Get other user (only an authenticated admin user can access the endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'User created',
    type: ApiResponseDto<UserDocument>,
    example: new SwaggerResponseUtils().getExampleResponseWithUser(),
  })
  @CheckPolicies(new ReadOtherUserPolicyHandler())
  async findOtherUser(@Query() idDto: IdDto): Promise<ApiResponseDto<UserDocument>> {
    const user: UserDocument = await this.usersService.findOne(idDto.id);
    return new ApiResponseDto(user);
  }

  @Get('/list')
  @ApiOperation({ summary: 'List users with optional role filter, if role query param is undefined it return all users to any role founds (only an authenticated admin user can access the endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Users List',
    type: ApiResponseDto<UserDocument>,
    example: new SwaggerResponseUtils().getResponseWithUsersList(),
  })
  @CheckPolicies(new ListUsersPolicyHandler())
  async findAll(@Query(new ValidationPipe({ transform: true })) query: ListUsersQueryDto,): Promise<ApiResponseDto<PaginatedListDto<UserDocument>>> {
    const paginatedList: PaginatedListDto<UserDocument> = await this.usersService.findAllPaginated(query);
    return new ApiResponseDto(paginatedList);
  }
  @Patch()
  @ApiOperation({ summary: 'Update any property of other user, including password, role and isActive fields (only an authenticated admin user can access the endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: ApiResponseDto<User>,
    example: new SwaggerResponseUtils().getExampleResponseWithUser('User updated'),
  })
  @CheckPolicies(new UpdateOtherUserPolicyHandler())
  async updateOtherUser(@Query() idDto: IdDto, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto<User>> {
    const user: User = await this.usersService.updateOtherUser(idDto.id, updateUserDto);
    return new ApiResponseDto("User updated", user);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete other user (only an authenticated admin user can access the endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    type: ApiResponseDto<User>,
    example: new SwaggerResponseUtils().getExampleResponseWithUser('User deleted'),
  })
  @CheckPolicies(new DeleteOtherUserPolicyHandler())
  async removeOtherUser(@Query() idDto: IdDto): Promise<ApiResponseDto> {
    const user: User =  await this.usersService.removeOtherUser(idDto.id);
    return new ApiResponseDto('User deleted', user);
  }
}
