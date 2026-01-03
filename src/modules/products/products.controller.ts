import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ParseEnumPipe,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductType } from './schemas/product.schema';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { AuthUser } from 'src/common/decorators/user.decorator';
import {
  ApiCreateProduct,
  ApiFindAllProducts,
  ApiSearchProducts,
  ApiGetBusinessProducts,
  ApiGetCategoryProducts,
  ApiFindProductBySku,
  ApiFindProductById,
  ApiUpdateProduct,
  ApiDeleteProduct,
  ApiUpdateProductStock,
  ApiAddProductReview,
  ApiIncrementTimesOrdered
} from './decorators/swagger-products.decorator';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiCreateProduct()
  async create(@AuthUser('id') userId: string, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto, userId);
  }

  @Get('list')
  @ApiFindAllProducts()
  async findAll(
    @Query('businessId') businessId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type', new ParseEnumPipe(ProductType, { optional: true })) type?: ProductType,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) perPage?: number
  ) {
    return this.productsService.findAll(businessId, categoryId, type, includeInactive, page, perPage);
  }

  @Get('search')
  @ApiSearchProducts()
  async search(
    @Query('q') searchTerm: string,
    @Query('businessId') businessId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type', new ParseEnumPipe(ProductType, { optional: true })) type?: ProductType,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStockOnly', new DefaultValuePipe(false), ParseBoolPipe) inStockOnly?: boolean
  ) {
    return this.productsService.searchProducts(
      searchTerm, 
      businessId, 
      categoryId,
      type, 
      minPrice, 
      maxPrice, 
      inStockOnly);
  }

  @Get('business')
  @ApiGetBusinessProducts()
  async getBusinessProducts(
    @Query('businessId') businessId: string,
    @Query('type', new ParseEnumPipe(ProductType, { optional: true })) type?: ProductType,
  ) {
    return this.productsService.getBusinessProducts(businessId, type);
  }

  @Get('category')
  @ApiGetCategoryProducts()
  async getCategoryProducts(
    @Query('categoryId') categoryId: string,
    @Query('type', new ParseEnumPipe(ProductType, { optional: true })) type?: ProductType,
  ) {
    return this.productsService.getCategoryProducts(categoryId, type);
  }

  @Get('sku')
  @ApiFindProductBySku()
  async findBySku(@Query('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get()
  @ApiFindProductById()
  async findOne(@Query('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch()
  @ApiUpdateProduct()
  async update(@Query('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete()
  @ApiDeleteProduct()
  async remove(@Query('id') id: string) {
    return this.productsService.remove(id);
  }

  @Patch('stock')
  @HttpCode(HttpStatus.OK)
  @ApiUpdateProductStock()
  async updateStock(
    @Query('id') id: string,
    @Query('quantity', ParseIntPipe) quantity: number,
    @Query('operation') operation: 'add' | 'subtract'
  ) {
    return this.productsService.updateStock(id, quantity, operation);
  }

  @Patch('review')
  @HttpCode(HttpStatus.OK)
  @ApiAddProductReview()
  async addReview(
    @Query('id') id: string,
    @Query('rating', ParseIntPipe) rating: number
  ) {
    return this.productsService.addReview(id, rating);
  }

  @Patch('increment-ordered')
  @HttpCode(HttpStatus.OK)
  @ApiIncrementTimesOrdered()
  async incrementTimesOrdered(@Query('id') id: string) {
    return this.productsService.incrementTimesOrdered(id);
  }
}