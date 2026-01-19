import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Delete, 
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
  UseGuards
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { IdDto } from 'src/common/dto/id.dto';
import {
  ApiCreateCategory,
  ApiFindAllCategories,
  ApiGetRootCategories,
  ApiGetCategoryTree,
  ApiFindCategoryById,
  ApiUpdateCategory,
  ApiDeleteCategory
} from './decorators/swagger-categories.decorator';
import { CheckPolicies } from '../casl/decorators/policies.decorator';
import { CreateCategoryPolicy } from './policies/create-category.policy';
import { ReadCategoryPolicy } from './policies/read-category.policy';
import { UpdateCategoryPolicy } from './policies/update-category.policy';
import { DeleteCategoryPolicy } from './policies/delete-category.policy';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { Category } from './schemas/category.schema';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @CheckPolicies(new CreateCategoryPolicy())
  @ApiCreateCategory()
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ApiResponseDto<Category>> {
    const category = await this.categoriesService.create(createCategoryDto);
    return new ApiResponseDto("Category created successfully", category);
  }

  @Get('list')
  @CheckPolicies(new ReadCategoryPolicy())
  @ApiFindAllCategories()
  async findAll(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive: boolean
  ): Promise<ApiResponseDto<Category[]>> {
    const categories = await this.categoriesService.findAll(includeInactive);
    return new ApiResponseDto("Categories retrieved successfully", categories);
  }

  @Get('roots')
  @CheckPolicies(new ReadCategoryPolicy())
  @ApiGetRootCategories()
  async getRootCategories(): Promise<ApiResponseDto<Category[]>> {
    const rootCategories = await this.categoriesService.getRootCategories();
    return new ApiResponseDto("Root categories retrieved successfully", rootCategories);
  }

  @Get('tree')
  @CheckPolicies(new ReadCategoryPolicy())
  @ApiGetCategoryTree()
  async getCategoryTree(@Query('rootId') rootId?: string): Promise<ApiResponseDto<any>> {
    const categoryTree = await this.categoriesService.getCategoryTree(rootId);
    return new ApiResponseDto("Category tree retrieved successfully", categoryTree);
  }

  @Get()
  @CheckPolicies(new ReadCategoryPolicy())
  @ApiFindCategoryById()
  async findOne(@Query() idDto: IdDto): Promise<ApiResponseDto<Category>> {
    const category = await this.categoriesService.findCategoryWithHierarchy(idDto.id);
    return new ApiResponseDto("Category retrieved successfully", category);
  }

  @Patch()
  @CheckPolicies(new UpdateCategoryPolicy())
  @ApiUpdateCategory()
  async update(@Query() idDto: IdDto, @Body() updateCategoryDto: UpdateCategoryDto): Promise<ApiResponseDto<Category>> {
    const category = await this.categoriesService.update(idDto.id, updateCategoryDto);
    return new ApiResponseDto("Category updated successfully", category);
  }

  @Delete()
  @CheckPolicies(new DeleteCategoryPolicy())
  @ApiDeleteCategory()
  async remove(@Query() idDto: IdDto): Promise<ApiResponseDto<Category>> {
    const category = await this.categoriesService.remove(idDto.id);
    return new ApiResponseDto("Category deleted successfully", category);
  }
}