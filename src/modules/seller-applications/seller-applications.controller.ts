import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { SellerApplicationsService } from './seller-applications.service';
import { CreateSellerApplicationDto, ReviewSellerApplicationDto } from './dto/seller-application.dto';
import {
  CreateSellerApplicationPolicy,
  ListSellerApplicationsPolicy,
  ReadOwnSellerApplicationPolicy,
  ReviewSellerApplicationPolicy,
} from './policies/seller-application.policies';

@ApiTags('Seller Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('seller-applications')
export class SellerApplicationsController {
  constructor(private readonly sellerApplicationsService: SellerApplicationsService) {}

  @Post()
  @CheckPolicies(new CreateSellerApplicationPolicy())
  @ApiOperation({ summary: 'Request to become a seller (customer)' })
  async create(
    @AuthUser('id') userId: string,
    @Body() dto: CreateSellerApplicationDto,
  ): Promise<ApiResponseDto> {
    const application = await this.sellerApplicationsService.create(userId, dto);
    return new ApiResponseDto('Seller application submitted successfully', application);
  }

  @Get('me')
  @CheckPolicies(new ReadOwnSellerApplicationPolicy())
  @ApiOperation({ summary: 'Get my latest seller application' })
  async findMine(@AuthUser('id') userId: string): Promise<ApiResponseDto> {
    const application = await this.sellerApplicationsService.findMine(userId);
    return new ApiResponseDto('Seller application retrieved', application);
  }
}

@ApiTags('Admin Seller Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('admin/seller-applications')
export class AdminSellerApplicationsController {
  constructor(private readonly sellerApplicationsService: SellerApplicationsService) {}

  @Get()
  @CheckPolicies(new ListSellerApplicationsPolicy())
  @ApiOperation({ summary: 'List seller applications (admin)' })
  async list(@Query('status') status?: string): Promise<ApiResponseDto> {
    const applications = await this.sellerApplicationsService.list(status);
    return new ApiResponseDto('Seller applications listed', applications);
  }

  @Patch(':id')
  @CheckPolicies(new ReviewSellerApplicationPolicy())
  @ApiOperation({ summary: 'Approve or reject seller application (admin)' })
  async review(
    @Param('id') id: string,
    @AuthUser('id') adminId: string,
    @Body() dto: ReviewSellerApplicationDto,
  ): Promise<ApiResponseDto> {
    const application = await this.sellerApplicationsService.review(id, adminId, dto);
    return new ApiResponseDto('Seller application reviewed', application);
  }
}
