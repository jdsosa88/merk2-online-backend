// categories/swagger-categories.decorator.ts

import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { CategoryResponseDto } from "../dto/category-response.dto";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";

export function ApiCreateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new category' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'Category created successfully',
      type: ApiResponseDto<CategoryResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithCategory({
        message: 'Category created successfully'
      }),
    }),
    ApiResponse({ status: 409, description: 'Category name already exists' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
  );
}

export function ApiFindAllCategories() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all categories' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ 
      name: 'includeInactive', 
      required: false, 
      type: Boolean, 
      description: 'Include inactive categories' 
    }),
    ApiResponse({
      status: 200,
      description: 'List of categories',
      type: ApiResponseDto<CategoryResponseDto>,
      example: new SwaggerResponseUtils().getResponseWithCategoriesList(),
    }),
  );
}

export function ApiGetRootCategories() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all root categories' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'List of root categories',
      type: ApiResponseDto<CategoryResponseDto>,
      example: new SwaggerResponseUtils().getResponseWithCategoriesList({ isRoot: true }),
    }),
  );
}

export function ApiGetCategoryTree() {
  return applyDecorators(
    ApiOperation({ summary: 'Get category tree' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ 
      name: 'rootId', 
      required: false, 
      description: 'Root category ID for the tree' 
    }),
    ApiResponse({
      status: 200,
      description: 'Category tree structure',
      type: ApiResponseDto<CategoryResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithCategoryTree(),
    }),
  );
}

export function ApiFindCategoryById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get category by ID with full hierarchy' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: 200,
      description: 'Category with subcategories and parents',
      type: ApiResponseDto<CategoryResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithCategory({
        withHierarchy: true
      }),
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
  );
}

export function ApiUpdateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a category' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: 200,
      description: 'Category updated successfully',
      type: ApiResponseDto<CategoryResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithCategory({
        message: 'Category updated successfully'
      }),
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
    ApiResponse({ status: 409, description: 'Category name already exists' }),
  );
}

export function ApiDeleteCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a category' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: 200,
      description: 'Category deleted successfully',
      type: ApiResponseDto<CategoryResponseDto>,
      example: new SwaggerResponseUtils().getExampleResponseWithCategory({
        message: 'Category deleted successfully'
      }),
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
    ApiResponse({ status: 400, description: 'Cannot delete category with subcategories' }),
  );
}