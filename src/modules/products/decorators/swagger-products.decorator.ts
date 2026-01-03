import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { ProductResponseDto } from "../dto/product-response.dto";
import { ProductType } from "../schemas/product.schema";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";

export function ApiCreateProduct() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new product' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'Product created successfully',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithProduct({
        message: 'Product created successfully'
      }),
    }),
    ApiResponse({ status: 409, description: 'Product SKU already exists' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
  );
}

export function ApiFindAllProducts() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all products with filters and pagination' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' }),
    ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' }),
    ApiQuery({ name: 'type', required: false, enum: ProductType, description: 'Filter by product type' }),
    ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive products' }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiResponse({
      status: 200,
      description: 'List of products',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getResponseWithProductsList(),
    }),
  );
}

export function ApiSearchProducts() {
  return applyDecorators(
    ApiOperation({ summary: 'Search products' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'q', required: true, description: 'Search term' }),
    ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' }),
    ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' }),
    ApiQuery({ name: 'type', required: false, enum: ProductType, description: 'Filter by product type' }),
    ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' }),
    ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' }),
    ApiQuery({ name: 'inStockOnly', required: false, type: Boolean, description: 'Only products in stock' }),
    ApiResponse({
      status: 200,
      description: 'Search results',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getResponseWithProductsList(),
    }),
  );
}

export function ApiGetBusinessProducts() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all products for a business' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'businessId', description: 'Business ID' }),
    ApiQuery({ name: 'type', required: false, enum: ProductType, description: 'Filter by product type' }),
    ApiResponse({
      status: 200,
      description: 'Business products',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getResponseWithProductsList(),
    }),
  );
}

export function ApiGetCategoryProducts() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all products in a category' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'categoryId', description: 'Category ID' }),
    ApiQuery({ name: 'type', required: false, enum: ProductType, description: 'Filter by product type' }),
    ApiResponse({
      status: 200,
      description: 'Category products',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getResponseWithProductsList(),
    }),
  );
}

export function ApiFindProductBySku() {
  return applyDecorators(
    ApiOperation({ summary: 'Get product by SKU' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'sku', description: 'Product SKU' }),
    ApiResponse({
      status: 200,
      description: 'Product details',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithProduct({}),
    }),
    ApiResponse({ status: 404, description: 'Product not found' }),
  );
}

export function ApiFindProductById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get product by ID' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiResponse({
      status: 200,
      description: 'Product details',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithProduct({}),
    }),
    ApiResponse({ status: 404, description: 'Product not found' }),
  );
}

export function ApiUpdateProduct() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a product' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiResponse({
      status: 200,
      description: 'Product updated successfully',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithProduct({
        message: 'Product updated successfully'
      }),
    }),
    ApiResponse({ status: 404, description: 'Product not found' }),
    ApiResponse({ status: 409, description: 'Product SKU already exists' }),
  );
}

export function ApiDeleteProduct() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a product' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiResponse({
      status: 200,
      description: 'Product deleted successfully',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithProduct({
        message: 'Product deleted successfully'
      }),
    }),
    ApiResponse({ status: 404, description: 'Product not found' }),
  );
}

export function ApiUpdateProductStock() {
  return applyDecorators(
    ApiOperation({ summary: 'Update product stock' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiQuery({ name: 'quantity', required: true, type: Number, description: 'Quantity to add/subtract' }),
    ApiQuery({ name: 'operation', required: true, enum: ['add', 'subtract'], description: 'Operation type' }),
    ApiResponse({
      status: 200,
      description: 'Stock updated successfully',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithProduct({
        message: 'Stock updated successfully'
      }),
    }),
    ApiResponse({ status: 404, description: 'Product not found' }),
    ApiResponse({ status: 400, description: 'Insufficient stock' }),
  );
}

export function ApiAddProductReview() {
  return applyDecorators(
    ApiOperation({ summary: 'Add a review to product' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiQuery({ name: 'rating', required: true, type: Number, description: 'Rating (0-5)' }),
    ApiResponse({
      status: 200,
      description: 'Review added successfully',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithProduct({
        message: 'Review added successfully'
      }),
    }),
    ApiResponse({ status: 404, description: 'Product not found' }),
  );
}

export function ApiIncrementTimesOrdered() {
  return applyDecorators(
    ApiOperation({ summary: 'Increment times ordered counter' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiResponse({
      status: 200,
      description: 'Counter incremented',
      type: ApiResponseDto<ProductResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithProduct({
        message: 'Times ordered incremented'
      }),
    }),
    ApiResponse({ status: 404, description: 'Product not found' }),
  );
}