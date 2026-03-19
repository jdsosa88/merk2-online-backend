import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { Product, ProductType } from "../schemas/product.schema";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";
import { DeleteImagesDto } from "../dto/delete-images.dto";

export function ApiCreateProduct() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Create a new product' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'Product created successfully',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithProduct({
        message: 'Product created successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
      type: ErrorResponseDto,
      examples: {
        businessNotFound: { summary: 'Business not found', value: utils.getBadRequestError('Business not found') },
        categoryNotFound: { summary: 'Category not found', value: utils.getBadRequestError('Category not found') },
        categoryNotInBusiness: { summary: 'Category not in business', value: utils.getBadRequestError('Category not included in business') },
        invalidAddons: { summary: 'Invalid addons', value: utils.getProductInvalidAddonsError() },
        addonAssigned: { summary: 'Addon assigned', value: utils.getBadRequestError('One or more addons are already assigned to another product') },
        missingParent: { summary: 'Missing parent', value: utils.getBadRequestError('Addon product must have a parent product') },
        parentNotFound: { summary: 'Parent not found', value: utils.getBadRequestError('Parent product not found or is not of type SIMPLE') },
        differentBusiness: { summary: 'Different business', value: utils.getBadRequestError('Addon must belong to the same business as parent product') }
      }
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      examples: {
        invalidToken: { summary: 'Invalid Token', value: utils.getInvalidTokenError() },
        inactiveUser: { summary: 'Inactive User', value: utils.getInactiveUserError() },
        notOwnerOrManager: { summary: 'Not owner/manager', value: utils.getUnauthorizedError('Only business owner or manager can create products') }
      }
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 409,
      description: 'Product SKU already exists',
      type: ErrorResponseDto,
      example: utils.getProductSkuConflictError('SKU-123')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError('Error creating product')
    }),
  );
}

export function ApiFindAllProducts() {
  const utils = new SwaggerResponseUtils();
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
      type: ApiResponseDto,
      example: utils.getResponseWithProductsList(),
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

export function ApiSearchProducts() {
  const utils = new SwaggerResponseUtils();
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
      type: ApiResponseDto,
      example: utils.getResponseWithProductsList(),
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

export function ApiGetBusinessProducts() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get all products for a business' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'businessId', description: 'Business ID' }),
    ApiQuery({ name: 'type', required: false, enum: ProductType, description: 'Filter by product type' }),
    ApiResponse({
      status: 200,
      description: 'Business products',
      type: ApiResponseDto,
      example: utils.getResponseWithProductsList(),
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
      description: 'Business not found',
      type: ErrorResponseDto,
      example: utils.getBusinessNotFoundError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiGetCategoryProducts() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get all products in a category' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'categoryId', description: 'Category ID' }),
    ApiQuery({ name: 'type', required: false, enum: ProductType, description: 'Filter by product type' }),
    ApiResponse({
      status: 200,
      description: 'Category products',
      type: ApiResponseDto,
      example: utils.getResponseWithProductsList(),
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

export function ApiFindProductBySku() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get product by SKU' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'sku', description: 'Product SKU' }),
    ApiResponse({
      status: 200,
      description: 'Product details',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithProduct({}),
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
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductSkuNotFoundError('SKU-123')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiFindProductById() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get product by ID' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiResponse({
      status: 200,
      description: 'Product details',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithProduct({}),
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
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductNotFoundError('<id>')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiUpdateProduct() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Update a product' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiResponse({
      status: 200,
      description: 'Product updated successfully',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithProduct({
        message: 'Product updated successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
      type: ErrorResponseDto,
      examples: {
        categoryNotFound: { summary: 'Category not found', value: utils.getBadRequestError('Category not found') },
        categoryNotInBusiness: { summary: 'Category not in business', value: utils.getBadRequestError('Category not included in business') },
        cannotChangeType: { summary: 'Cannot change type', value: utils.getBadRequestError('Cannot change product type') },
        invalidAddons: { summary: 'Invalid addons', value: utils.getProductInvalidAddonsError() },
        addonAssigned: { summary: 'Addon assigned', value: utils.getBadRequestError('One or more addons are already assigned to another product') },
        invalidParent: { summary: 'Invalid parent', value: utils.getBadRequestError('Parent product not found or is not of type SIMPLE') },
        differentBusiness: { summary: 'Different business', value: utils.getBadRequestError('Addon must belong to the same business as parent product') }
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
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductNotFoundError('<id>')
    }),
    ApiResponse({
      status: 409,
      description: 'Product SKU already exists',
      type: ErrorResponseDto,
      example: utils.getProductSkuConflictError('SKU-123')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiDeleteProduct() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Delete a product' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiResponse({
      status: 200,
      description: 'Product deleted successfully',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithProduct({
        message: 'Product deleted successfully'
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
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductNotFoundError('<id>')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiUpdateProductStock() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Update product stock' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiQuery({ name: 'quantity', required: true, type: Number, description: 'Quantity to add/subtract' }),
    ApiQuery({ name: 'operation', required: true, enum: ['add', 'subtract'], description: 'Operation type' }),
    ApiResponse({
      status: 200,
      description: 'Stock updated successfully',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithProduct({
        message: 'Stock updated successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Insufficient stock',
      type: ErrorResponseDto,
      example: utils.getProductInsufficientStockError()
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
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductNotFoundError('<id>')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiAddProductReview() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Add a review to product' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiQuery({ name: 'rating', required: true, type: Number, description: 'Rating (0-5)' }),
    ApiResponse({
      status: 200,
      description: 'Review added successfully',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithProduct({
        message: 'Review added successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid rating',
      type: ErrorResponseDto,
      example: utils.getBadRequestError('Rating must be between 0 and 5')
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
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductNotFoundError('<id>')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiIncrementTimesOrdered() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Increment times ordered counter' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', description: 'Product ID' }),
    ApiResponse({
      status: 200,
      description: 'Counter incremented',
      type: ApiResponseDto,
      example: utils.getExampleResponseWithProduct({
        message: 'Times ordered incremented'
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
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductNotFoundError('<id>')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiUploadProductImages() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Upload product images (max 10 files)' }),
    ApiBearerAuth('JWT'),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          images: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Image files (max 10)',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Images uploaded successfully',
      type: ApiResponseDto<Product>,
      example: utils.getExampleResponseWithProduct({ message: 'Images uploaded successfully' }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - No images or limit exceeded',
      type: ErrorResponseDto,
      examples: {
        noImages: { summary: 'No images', value: utils.getBadRequestError('You must add at least one image') },
        limitExceeded: { summary: 'Limit exceeded', value: utils.getBadRequestError('You have exceeded the maximum number of images allowed per product') },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError(),
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only owner, manager or admin can upload images',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('Only business owner, manager or system admin can access this endpoint'),
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductNotFoundError('<id>'),
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError(),
    }),
  );
}

export function ApiDeleteProductImages() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Delete specific images from a product' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'id',
      required: true,
      type: String,
      description: 'Product ID',
    }),
    ApiBody({
      type: DeleteImagesDto,
      description: 'Array of image IDs to delete',
    }),
    ApiResponse({
      status: 200,
      description: 'Images deleted successfully',
      type: ApiResponseDto<Product>,
      example: utils.getExampleResponseWithProduct({ message: 'Images deleted successfully' }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - No valid image IDs',
      type: ErrorResponseDto,
      example: utils.getBadRequestError('No valid image IDs provided'),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError(),
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only owner, manager or admin can delete images',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('Only business owner, manager or system admin can access this endpoint'),
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found',
      type: ErrorResponseDto,
      example: utils.getProductNotFoundError('<id>'),
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError(),
    }),
  );
}
