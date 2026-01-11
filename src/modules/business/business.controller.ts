import {
  Body,
  Controller,
  Post,
  UseGuards,
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
import { Business } from './schemas/business.schema';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { Types } from 'mongoose';
import { UpdateBusinessByOwnerDto } from './dto/update-business.dto';
import { UpdateBusinessPolicy } from './policies/update-business.policy';
import { ReadBusinessPolicy } from './policies/read-business.policy';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { ApiAddEmployee, ApiGetBusiness, ApiRequestCreateBusiness, ApiRespondEmploymentRequest, ApiUpdateBusinessByOwner } from './decorators/swagger-business.decorator';
import { IdDto } from 'src/common/dto/id.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { EmployeeService } from './employee.service';
import { EmploymentRequestService } from './employment-request.service';
import { User } from '../users/schemas/user.schema';
import { EmploymentRequestResponseDto } from './dto/employment-request-response.dto';
import { AddEmployeePolicy } from './policies/add-employee.policy';
import { RespondEmploymentRequestPolicy } from './policies/respond-employment-request.policy.ts';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('business')
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly employeeService: EmployeeService,
    private readonly employmentRequestService: EmploymentRequestService,
  ) { }

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
  ) {
    return this.businessService.findById(idDto.id);
  }

  @Post('employees')
  @CheckPolicies(new AddEmployeePolicy())
  @ApiAddEmployee() 
  async addEmployee(
    @Query('id') businessId: string,
    @Body() addEmployeeDto: AddEmployeeDto,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.employeeService.addEmployee(businessId, addEmployeeDto, userId);
    return new ApiResponseDto(result.message, result.addEmployeeResponseDto);
  }

  @Patch('employment-requests')
  @CheckPolicies(new RespondEmploymentRequestPolicy())
  @ApiRespondEmploymentRequest()
  async acceptRejectRequest(
    @Query('id') requestId: string,
    @Body('isAccepted') isAccepted: boolean,
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<EmploymentRequestResponseDto>> {
    const result = await this.employmentRequestService.manageEmploymentRequestResponse({ requestId, user, isAccepted });
    return new ApiResponseDto(`Employment request ${isAccepted ? 'accepted' : 'rejected'}`, result);
  }
}