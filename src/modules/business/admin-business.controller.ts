import {
  Body,
  Controller,
  UseGuards,
  Patch,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { BusinessService } from '../business/business.service';;
import { UpdateBusinessByAdminDto } from './dto/update-business.dto';
import { UpdateBusinessByAdminPolicy } from './policies/update-business.policy';
import { ApiUpdateBusinessByAdmin } from './decorators/swagger-business.decorator';
import { IdDto } from 'src/common/dto/id.dto';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';

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
  ) {
    const business = await this.businessService.updateBusinessByAdmin({ id: idDto.id, updateBusinessDto });
    return new ApiResponseDto('Business updated successfully', business);
  }

}