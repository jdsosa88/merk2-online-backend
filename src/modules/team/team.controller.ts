import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { TeamService } from './team.service';
import {
  AssignTeamMemberStoresDto,
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team.dto';
import { ManageTeamPolicy } from './policies/team.policies';

@ApiTags('Team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @CheckPolicies(new ManageTeamPolicy())
  @ApiOperation({ summary: 'List my team members (messengers + managers)' })
  async listMine(@AuthUser('id') userId: string): Promise<ApiResponseDto> {
    const members = await this.teamService.listMine(userId);
    return new ApiResponseDto('Team retrieved', members);
  }

  @Post()
  @CheckPolicies(new ManageTeamPolicy())
  @ApiOperation({ summary: 'Create a team member (MESSENGER or MANAGER)' })
  async create(
    @AuthUser('id') userId: string,
    @Body() dto: CreateTeamMemberDto,
  ): Promise<ApiResponseDto> {
    const member = await this.teamService.createMember(userId, dto);
    return new ApiResponseDto('Team member created', member);
  }

  @Patch(':id')
  @CheckPolicies(new ManageTeamPolicy())
  @ApiOperation({ summary: 'Update team member' })
  async update(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @Body() dto: UpdateTeamMemberDto,
  ): Promise<ApiResponseDto> {
    const member = await this.teamService.updateMember(userId, id, dto);
    return new ApiResponseDto('Team member updated', member);
  }

  @Put(':id/stores')
  @CheckPolicies(new ManageTeamPolicy())
  @ApiOperation({ summary: 'Assign messenger to selected stores for delivery' })
  async assignStores(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @Body() dto: AssignTeamMemberStoresDto,
  ): Promise<ApiResponseDto> {
    const member = await this.teamService.assignStores(userId, id, dto);
    return new ApiResponseDto('Messenger stores updated', member);
  }

  @Delete(':id')
  @CheckPolicies(new ManageTeamPolicy())
  @ApiOperation({ summary: 'Delete team member' })
  async remove(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto> {
    const member = await this.teamService.deleteMember(userId, id);
    return new ApiResponseDto('Team member deleted', member);
  }
}
