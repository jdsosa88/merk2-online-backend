import { 
  Body, 
  Controller, 
  Post, 
  UseGuards, 
  Put, 
  Param,
  Get,
  Patch,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { CreateBusinessPolicy } from './policies/create-business.policy';

import {
  ApiCreatedResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Business } from './schemas/business.schema';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { Types } from 'mongoose';
import { UpdateBusinessByOwnerDto } from './dto/update-business.dto';
import { UpdateBusinessPolicy } from './policies/update-business.policy';
import { ReadBusinessPolicy } from './policies/read-business.policy';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { ApiGetBusiness, ApiRequestCreateBusiness, ApiUpdateBusinessByOwner } from './decorators/swagger-business.decorator';
import { IdDto } from 'src/common/dto/id.dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('request-create-business')
  @CheckPolicies(new CreateBusinessPolicy())
  @ApiRequestCreateBusiness()
  async requestCreateBusiness(
    @Body() createBusinessDto: CreateBusinessDto,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto<Business>> {
    const newBusiness = await this.businessService.requestCreateBusiness(
      createBusinessDto, 
      new Types.ObjectId(userId)
    );
    return new ApiResponseDto("The business has been successfully requested", newBusiness);
  }

  @Patch()  
  @CheckPolicies(new UpdateBusinessPolicy())
  @ApiUpdateBusinessByOwner()
  async updateBusinessByOwner(
    @Query() idDto: IdDto,
    @Body() updateBusinessDto: UpdateBusinessByOwnerDto,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto<Business>> {
    const updatedBusiness = await this.businessService.updateBusinessByOwner({
      id: idDto.id,
      updateBusinessDto,
      userId,
    });
    return new ApiResponseDto("Business updated successfully", updatedBusiness);
  }

  @Get()  
  @CheckPolicies(new ReadBusinessPolicy())
  @ApiGetBusiness()
  async getBusiness(
    @Query() idDto: IdDto,
    @AuthUser('id') userId: string,
  ) {
    return this.businessService.findById(idDto.id, userId);
  }
}