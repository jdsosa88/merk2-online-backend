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

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @CheckPolicies(new CreateCategoryPolicy())
  @ApiCreateCategory()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return category;
  }

  @Get('list')
  @CheckPolicies(new ReadCategoryPolicy())
  @ApiFindAllCategories()
  async findAll(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive: boolean
  ) {
    return this.categoriesService.findAll(includeInactive);
  }

  @Get('roots')
  @CheckPolicies(new ReadCategoryPolicy())
  @ApiGetRootCategories()
  async getRootCategories() {
    return this.categoriesService.getRootCategories();
  }

  @Get('tree')
  @CheckPolicies(new ReadCategoryPolicy())
  @ApiGetCategoryTree()
  async getCategoryTree(@Query('rootId') rootId?: string) {
    return this.categoriesService.getCategoryTree(rootId);
  }

  @Get()
  @CheckPolicies(new ReadCategoryPolicy())
  @ApiFindCategoryById()
  async findOne(@Query() idDto: IdDto) {
    return this.categoriesService.findCategoryWithHierarchy(idDto.id);
  }

  @Patch()
  @CheckPolicies(new UpdateCategoryPolicy())
  @ApiUpdateCategory()
  async update(@Query() idDto: IdDto, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(idDto.id, updateCategoryDto);
  }

  @Delete()
  @CheckPolicies(new DeleteCategoryPolicy())
  @ApiDeleteCategory()
  async remove(@Query() idDto: IdDto) {
    return this.categoriesService.remove(idDto.id);
  }
}