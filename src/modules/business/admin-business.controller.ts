import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { BusinessService } from '../business/business.service';
import { UpdateBusinessByAdminDto } from './dto/update-business.dto';
import { UpdateBusinessByAdminPolicy } from './policies/update-business.policy';
import { ApiDeleteBusiness, ApiGetBusinessesByOwner, ApiGetBusinessesByOwnerAsAdmin, ApiUpdateBusinessByAdmin } from './decorators/swagger-business.decorator';
import { IdDto } from 'src/common/dto/id.dto';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { Business } from '../business/schemas/business.schema';
import { DeleteBusinessPolicy } from './policies/delete-business.policy';
import { ReadBusinessPolicy } from './policies/read-business.policy';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { UserRole } from '../users/types/users.type';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/businesses')
export class AdminBusinessController {
  constructor(private readonly businessService: BusinessService) { }

  @Patch()
  @CheckPolicies(new UpdateBusinessByAdminPolicy())
  @ApiUpdateBusinessByAdmin()
  async updateBusinessByAdmin(
    @Query() idDto: IdDto,
    @Body() updateBusinessDto: UpdateBusinessByAdminDto,
  ): Promise<ApiResponseDto<Business>> {
    const business = await this.businessService.updateBusinessByAdmin({
      id: idDto.id,
      updateBusinessDto
    });
    return new ApiResponseDto('Business updated successfully', business);
  }

  @Get('by-owner')
    @CheckPolicies(new ReadBusinessPolicy())
    @ApiGetBusinessesByOwnerAsAdmin()
    async getMyBusinesses(
      @AuthUser('role') userRole: UserRole,
      @Query('ownerId') ownerId: string,
    ): Promise<ApiResponseDto<Business[]>> {
      const businesses = await this.businessService.findBusinessesByOwnerAsAdmin(ownerId, userRole);
      return new ApiResponseDto('Businesses retrieved successfully', businesses);
    }

    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    @CheckPolicies(new DeleteBusinessPolicy())
    @ApiDeleteBusiness()
    async deleteBusiness(
      @Query() idDto: IdDto,      
    ): Promise<void> {
      await this.businessService.deleteBusiness(idDto.id);
    }
}