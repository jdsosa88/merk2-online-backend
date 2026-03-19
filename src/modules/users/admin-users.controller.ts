import { Body, Controller, Delete, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PoliciesGuard } from "src/common/guards/policies.guard";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { CheckPolicies } from "../casl/decorators/policies.decorator";
import { User } from "./schemas/user.schema";
import { UpdateUserDto } from "./dto/update-user.dto"
import { IdDto } from "src/common/dto/id.dto";
import {
  ApiCreateAdmin,
  ApiDeleteAvatar,
  ApiRemoveOtherUser,
  ApiUpdateOtherUser,
  ApiUploadAvatar
} from "./decorators/swagger-users.decorator";
import { CreateUserPolicyHandler } from "./policies/create-user.policy";
import { UpdateOtherUserPolicyHandler } from "./policies/update-user.policy";
import { DeleteOtherUserPolicyHandler } from "./policies/delete-user.policy";
import { Role } from "./types/users.type";
import { FileService } from "src/common/services/file.service";
import { FileInterceptor } from "@nestjs/platform-express";

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

  @Post('avatar')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(new UpdateOtherUserPolicyHandler())
  @ApiUploadAvatar()
  @UseInterceptors(FileInterceptor('avatar', {
    storage: FileService.getDiskStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: FileService.imageFileFilter,
  }))
  async uploadOtherUserAvatar(
    @Query() idDto: IdDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<User>> {
    const updatedUser = await this.usersService.uploadOtherUserAvatarImage(idDto.id, file);
    return new ApiResponseDto('Avatar updated successfully', updatedUser);
  }

  @Delete()
  @CheckPolicies(new DeleteOtherUserPolicyHandler())
  @ApiRemoveOtherUser()
  async removeOtherUser(@Query() idDto: IdDto): Promise<ApiResponseDto> {
    const user: User = await this.usersService.removeOtherUser(idDto.id);
    return new ApiResponseDto('User deleted', user);
  }

  @Delete('avatar')
  @CheckPolicies(new UpdateOtherUserPolicyHandler())
  @ApiDeleteAvatar()
  async deleteAvatar(@Query() idDto: IdDto) {
    const updatedUser = await this.usersService.deleteOtherUserAvatarImage(idDto.id);
    return new ApiResponseDto('Avatar deleted successfully', updatedUser);
  }
}
