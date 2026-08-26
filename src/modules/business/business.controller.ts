import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Patch,
  Query,
  Delete,
  UploadedFiles,
  UseInterceptors,
  GoneException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { BusinessService } from './business.service';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { Business } from './schemas/business.schema';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { Types } from 'mongoose';
import { UpdateBusinessByOwnerDto } from './dto/update-business.dto';
import { UpdateBusinessImagePolicy, UpdateBusinessPolicy } from './policies/update-business.policy';
import { ReadBusinessPolicy } from './policies/read-business.policy';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { ApiAddEmployee, ApiDeleteBusinessImages, ApiGetBusiness, ApiGetBusinessesByOwner, ApiListBusiness, ApiRemoveBusinessCategories, ApiRequestCreateBusiness, ApiRequestDeleteBusiness, ApiRespondEmploymentRequest, ApiUpdateBusinessByOwner, ApiUploadBusinessImages } from './decorators/swagger-business.decorator';
import { IdDto } from 'src/common/dto/id.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { EmployeeService } from './employee.service';
import { EmploymentRequestService } from './employment-request.service';
import { User } from '../users/schemas/user.schema';
import { EmploymentRequestResponseDto } from './dto/employment-request-response.dto';
import { AddEmployeePolicy } from './policies/add-employee.policy';
import { RespondEmploymentRequestPolicy } from './policies/respond-employment-request.policy.ts';
import { ListBusinessPolicyHandler } from './policies/list-business.policy';
import { ListBusinessQueryDto } from './dto/list-business-query.dto';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';
import { RemoveCategoriesDto } from './dto/remove-categories.dto';
import { RemoveBusinessCategoriesPolicyHandler } from './policies/remove-business-categories.policy';
import { RequestDeleteBusinessPolicy } from './policies/request-delete-business.policy';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileService } from 'src/common/services/file.service';
import { ImageToDeleteType } from './types/business.type';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('businesses')
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly employeeService: EmployeeService,
    private readonly employmentRequestService: EmploymentRequestService,
  ) { }

  /**
   * @deprecated Use POST /seller-applications instead.
   */
  @Post('request-create-business')
  @HttpCode(HttpStatus.GONE)
  @ApiRequestCreateBusiness()
  async requestCreateBusiness(): Promise<never> {
    throw new GoneException(
      'This endpoint is deprecated. Use POST /seller-applications to request seller approval.',
    );
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

  @Delete('categories')
  @CheckPolicies(new RemoveBusinessCategoriesPolicyHandler())
  @ApiRemoveBusinessCategories()
  async removeBusinessCategories(
    @Query('id') businessId: string,
    @Body() removeCategoriesDto: RemoveCategoriesDto,
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<Business>> {

    const updatedBusiness = await this.businessService.removeCategories({
      businessId,
      categoryIds: removeCategoriesDto.categories,
      userId: user._id.toString(),
      userRole: user.role,
    });

    return new ApiResponseDto(
      'Categories removed successfully from business',
      updatedBusiness
    );
  }

  @Get()
  @CheckPolicies(new ReadBusinessPolicy())
  @ApiGetBusiness()
  async getBusiness(
    @Query() idDto: IdDto,
  ): Promise<ApiResponseDto<Business>> {
    const business = await this.businessService.findById(idDto.id);
    return new ApiResponseDto('Business retrieved successfully', business);
  }

  @Get('by-owner')
  @CheckPolicies(new ReadBusinessPolicy())
  @ApiGetBusinessesByOwner()
  async getMyBusinesses(
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto<Business[]>> {
    const businesses = await this.businessService.findBusinessesByOwner(userId);
    return new ApiResponseDto('Businesses retrieved successfully', businesses);
  }

  @Get('list')
  @CheckPolicies(new ListBusinessPolicyHandler())
  @ApiListBusiness()
  async findAll(@Query() query: ListBusinessQueryDto): Promise<ApiResponseDto<PaginatedListDto<Business>>> {
    const paginatedList: PaginatedListDto<Business> = await this.businessService.findAllPaginated(query);
    return new ApiResponseDto(paginatedList);
  }

  @Delete('request-delete')
  @CheckPolicies(new RequestDeleteBusinessPolicy())
  @ApiRequestDeleteBusiness()
  async requestDeleteBusiness(
    @Query() idDto: IdDto,
    @AuthUser('id') userId: string,
  ): Promise<ApiResponseDto<Business>> {
    const business = await this.businessService.requestDeleteBusiness(
      idDto.id,
      userId
    );
    return new ApiResponseDto('Business deletion requested successfully', business);
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
    const result = await this.employmentRequestService.manageEmploymentRequestResponse({
      requestId,
      user,
      isAccepted
    });
    const message = `Employment request ${isAccepted ? 'accepted' : 'rejected'}`;
    return new ApiResponseDto(message, result);
  }


  @Post('upload-images')
  @CheckPolicies(new UpdateBusinessImagePolicy())
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'pic', maxCount: 1 },
    { name: 'portalPic', maxCount: 1 },
  ], {
    storage: FileService.getDiskStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: FileService.imageFileFilter,
  }))
  @ApiUploadBusinessImages()
  async uploadBusinessImages(
    @Query() idDto: IdDto,
    @UploadedFiles() files: { pic?: Express.Multer.File[]; portalPic?: Express.Multer.File[] },
  ): Promise<ApiResponseDto<Business>> {
    const businessWithImages = await this.businessService.uploadBusinessImages({
      businessId: idDto.id,
      picFiles: files ? files.pic : undefined,
      portalPicFiles: files ? files.portalPic : undefined,
    });
    return new ApiResponseDto("Business updated successfully", businessWithImages);
  }

  @Delete('delete-images')
  @CheckPolicies(new UpdateBusinessImagePolicy())
  @ApiDeleteBusinessImages()
  async deleteBusinessImages(
    @Query('id') businessId: string,
    @Query('imageToDelete') imageToDelete: ImageToDeleteType,
  ): Promise<ApiResponseDto<Business>> {
    const updatedBusiness = await this.businessService.deleteBusinessImage({
      businessId,
      imageToDelete,
    });
    return new ApiResponseDto("Business images deleted successfully", updatedBusiness);
  }

}