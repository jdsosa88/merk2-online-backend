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
  ParseIntPipe,
  ParseEnumPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
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
  ApiGetStoreProducts,
  ApiGetCategoryProducts,
  ApiFindProductBySku,
  ApiFindProductById,
  ApiUpdateProduct,
  ApiDeleteProduct,
  ApiUpdateProductStock,
  ApiAddProductReview,
  ApiIncrementTimesOrdered,
  ApiDeleteProductImages,
  ApiUploadProductImages
} from './decorators/swagger-products.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { Product } from './schemas/product.schema';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileService } from 'src/common/services/file.service';
import { IdDto } from 'src/common/dto/id.dto';
import { User } from '../users/schemas/user.schema';
import { DeleteImagesDto } from './dto/delete-images.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @ApiCreateProduct()
  async create(
    @AuthUser('id') userId: string,
    @Body() createProductDto: CreateProductDto
  ): Promise<ApiResponseDto<Product>> {
    const product = await this.productsService.create(createProductDto, userId);
    return new ApiResponseDto("Product created successfully", product);
  }

  @Get('list')
  @ApiFindAllProducts()
  async findAll(
    @Query('storeId') storeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type', new ParseEnumPipe(ProductType, { optional: true })) type?: ProductType,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe) includeInactive?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) perPage?: number
  ): Promise<ApiResponseDto<PaginatedListDto<Product>>> {
    const result = await this.productsService.findAll(storeId, categoryId, type, includeInactive, page, perPage);
    return new ApiResponseDto("Products retrieved successfully", result);
  }

  @Get('search')
  @ApiSearchProducts()
  async search(
    @Query('q') searchTerm: string,
    @Query('storeId') storeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type', new ParseEnumPipe(ProductType, { optional: true })) type?: ProductType,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStockOnly', new DefaultValuePipe(false), ParseBoolPipe) inStockOnly?: boolean
  ): Promise<ApiResponseDto<Product[]>> {
    const products = await this.productsService.searchProducts(
      searchTerm,
      storeId,
      categoryId,
      type,
      minPrice,
      maxPrice,
      inStockOnly
    );
    return new ApiResponseDto("Products search completed", products);
  }

  @Get('store')
  @ApiGetStoreProducts()
  async getStoreProducts(
    @Query('storeId') storeId: string,
    @Query('type', new ParseEnumPipe(ProductType, { optional: true })) type?: ProductType,
  ): Promise<ApiResponseDto<Product[]>> {
    const products = await this.productsService.getStoreProducts(storeId, type);
    return new ApiResponseDto("Store products retrieved", products);
  }

  @Get('category')
  @ApiGetCategoryProducts()
  async getCategoryProducts(
    @Query('categoryId') categoryId: string,
    @Query('type', new ParseEnumPipe(ProductType, { optional: true })) type?: ProductType,
  ): Promise<ApiResponseDto<Product[]>> {
    const products = await this.productsService.getCategoryProducts(categoryId, type);
    return new ApiResponseDto("Category products retrieved", products);
  }

  @Get('sku')
  @ApiFindProductBySku()
  async findBySku(@Query('sku') sku: string): Promise<ApiResponseDto<Product>> {
    const product = await this.productsService.findBySku(sku);
    return new ApiResponseDto("Product retrieved by SKU", product);
  }

  @Get()
  @ApiFindProductById()
  async findOne(@Query('id') id: string): Promise<ApiResponseDto<Product>> {
    const product = await this.productsService.findOne(id);
    return new ApiResponseDto("Product retrieved", product);
  }

  @Patch()
  @ApiUpdateProduct()
  async update(
    @Query('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<ApiResponseDto<Product>> {
    const product = await this.productsService.update(id, updateProductDto);
    return new ApiResponseDto("Product updated successfully", product);
  }

  @Delete()
  @ApiDeleteProduct()
  async remove(@Query('id') id: string): Promise<ApiResponseDto<Product>> {
    const product = await this.productsService.remove(id);
    return new ApiResponseDto("Product deleted successfully", product);
  }

  @Patch('stock')
  @HttpCode(HttpStatus.OK)
  @ApiUpdateProductStock()
  async updateStock(
    @Query('id') id: string,
    @Query('quantity', ParseIntPipe) quantity: number,
    @Query('operation') operation: 'add' | 'subtract'
  ): Promise<ApiResponseDto<Product>> {
    const product = await this.productsService.updateStock(id, quantity, operation);
    return new ApiResponseDto("Product stock updated", product);
  }

  @Patch('review')
  @HttpCode(HttpStatus.OK)
  @ApiAddProductReview()
  async addReview(
    @Query('id') id: string,
    @Query('rating', ParseIntPipe) rating: number
  ): Promise<ApiResponseDto<Product>> {
    const product = await this.productsService.addReview(id, rating);
    return new ApiResponseDto("Review added to product", product);
  }

  @Patch('increment-ordered')
  @HttpCode(HttpStatus.OK)
  @ApiIncrementTimesOrdered()
  async incrementTimesOrdered(@Query('id') id: string): Promise<ApiResponseDto<Product>> {
    const product = await this.productsService.incrementTimesOrdered(id);
    return new ApiResponseDto("Times ordered incremented", product);
  }

  @Post('/upload-images')
  @ApiUploadProductImages()
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: FileService.getDiskStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: FileService.imageFileFilter,
  }))
  async uploadProductImages(
    @Query() idDto: IdDto,
    @UploadedFiles() images: Express.Multer.File[],
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<Product>> {
    
    const updatedProduct = await this.productsService.addProductImages({
      productId: idDto.id,
      user: user,
      images: images,
    });

    return new ApiResponseDto('Images uploaded successfully', updatedProduct);
  }

  @Post('/upload-visual-option-image')
  @ApiOperation({ summary: 'Upload image for a product visual option (stored on disk, returns product with image ids only)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'id', description: 'Product id' })
  @ApiQuery({ name: 'optionId', description: 'Visual option id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
      required: ['image'],
    },
  })
  @UseInterceptors(FileInterceptor('image', {
    storage: FileService.getDiskStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: FileService.imageFileFilter,
  }))
  async uploadVisualOptionImage(
    @Query('id') productId: string,
    @Query('optionId') optionId: string,
    @UploadedFile() image: Express.Multer.File,
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<Product>> {
    if (!productId || !optionId) {
      throw new BadRequestException('id and optionId query params are required');
    }
    if (!image) {
      throw new BadRequestException('image file is required');
    }
    const updatedProduct = await this.productsService.uploadVisualOptionImage({
      productId,
      optionId,
      user,
      image,
    });
    return new ApiResponseDto('Visual option image uploaded successfully', updatedProduct);
  }

  @Delete('delete-images')
  @ApiDeleteProductImages()
  async deleteProductImages(
    @Query() idDto: IdDto,
    @Body() deleteImagesDto: DeleteImagesDto,
    @AuthUser() user: User,
  ): Promise<ApiResponseDto<Product>>{
    const updatedProduct = await this.productsService.deleteProductImages({
      productId: idDto.id,
      user,
      imageIds: deleteImagesDto.images,
    });

    return new ApiResponseDto('Images deleted successfully', updatedProduct);
  }

}