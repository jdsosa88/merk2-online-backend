import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiProduces } from '@nestjs/swagger';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import { SwaggerResponseUtils } from 'src/common/utils/swagger-response-utils';

export function ApiGetImageById() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get image file by ID' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'id',
      required: true,
      type: String,
      description: 'Image ID (Mongo ObjectId)',
      example: '60d21b4667d0d8992e610c85',
    }),
    ApiProduces('image/*', 'application/json'),
    ApiResponse({
      status: 200,
      description: 'Image file (local) or redirect to external URL',
      content: {
        'image/*': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: 302,
      description: 'Redirect to external image URL',
      headers: {
        Location: {
          description: 'URL of the external image',
          schema: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Image file not available',
      type: ErrorResponseDto,
      example: utils.getBadRequestError('Image file not available'),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError(),
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError(),
    }),
    ApiResponse({
      status: 404,
      description: 'Image not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('Image not found'),
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError(),
    }),
  );
}

export function ApiGetImageByFilename() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get image file by filename' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'filename',
      required: true,
      type: String,
      description: 'Image filename',
      example: 'abc123.jpg',
    }),
    ApiProduces('image/*', 'application/json'),
    ApiResponse({
      status: 200,
      description: 'Image file (local) or redirect to external URL',
      content: {
        'image/*': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: 302,
      description: 'Redirect to external image URL',
      headers: {
        Location: {
          description: 'URL of the external image',
          schema: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Image file not available',
      type: ErrorResponseDto,
      example: utils.getBadRequestError('Image file not available'),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError(),
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError(),
    }),
    ApiResponse({
      status: 404,
      description: 'Image not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('Image not found'),
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError(),
    }),
  );
}