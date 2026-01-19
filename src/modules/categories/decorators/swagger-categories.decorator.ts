import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";

export function ApiCreateCategory() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Create a new category' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'Category created successfully',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithCategory({
        message: 'Category created successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
      type: ErrorResponseDto,
      examples: {
        parentNotFound: { summary: 'Parent not found', value: utils.getBadRequestError('Parent category does not exist') },
        subcategoryNotFound: { summary: 'Subcategory not found', value: utils.getBadRequestError('One or more subcategories do not exist') },
        validationError: { summary: 'Validation error', value: utils.getValidationError(['name should not be empty']) }
      }
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 409,
      description: 'Category name already exists',
      type: ErrorResponseDto,
      example: utils.getCategoryConflictError('Electronics')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError('Error creating category')
    }),
  );
}

export function ApiFindAllCategories() {
  const utils = new SwaggerResponseUtils();
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
      type: ApiResponseDto,
      example: utils.getResponseWithCategoriesList(),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiGetRootCategories() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get all root categories' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'List of root categories',
      type: ApiResponseDto,
      example: utils.getResponseWithCategoriesList({ isRoot: true }),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiGetCategoryTree() {
  const utils = new SwaggerResponseUtils();
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
      type: ApiResponseDto,
      example: utils.getExampleResponseWithCategoryTree(),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 404,
      description: 'Root category not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('Root category with ID <id> not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiFindCategoryById() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get category by ID with full hierarchy' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: 200,
      description: 'Category with subcategories and parents',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithCategory({
        withHierarchy: true
      }),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 404,
      description: 'Category not found',
      type: ErrorResponseDto,
      example: utils.getCategoryNotFoundError('<id>')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiUpdateCategory() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Update a category' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: 200,
      description: 'Category updated successfully',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithCategory({
        message: 'Category updated successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
      type: ErrorResponseDto,
      examples: {
        parentInactive: {
          summary: 'Parent inactive',
          value: utils.getBadRequestError('Cannot activate category because parent category is inactive')
        },
        subcategoryNotFound: {
          summary: 'Subcategory not found',
          value: utils.getBadRequestError('One or more subcategories do not exist')
        },
        validationError: {
          summary: 'Validation error',
          value: utils.getValidationError(['name should not be empty'])
        }
      }
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 404,
      description: 'Category not found',
      type: ErrorResponseDto,
      example: utils.getCategoryNotFoundError('<id>')
    }),
    ApiResponse({
      status: 409,
      description: 'Category name already exists',
      type: ErrorResponseDto,
      example: utils.getCategoryConflictError('Electronics')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiDeleteCategory() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Delete a category' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: 200,
      description: 'Category deleted successfully',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithCategory({
        message: 'Category deleted successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Cannot delete category with subcategories',
      type: ErrorResponseDto,
      example: utils.getCategoryHasSubcategoriesError()
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 404,
      description: 'Category not found',
      type: ErrorResponseDto,
      example: utils.getCategoryNotFoundError('<id>')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}