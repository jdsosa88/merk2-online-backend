import { applyDecorators } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { AppConfig } from "../schemas/app-config.schema";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";

export function ApiGetHealthStatus() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Get application health status',
      description: 'Returns the current status, version, and health of the API'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'API is operational',
      schema: {
        example: {
          status: 'operational',
          timestamp: '2024-01-15T10:30:00.000Z',
          service: 'Merk2 Online',
          apiVersion: '0.0.1',
          environment: 'development',
          uptime: 3600,
          dependencies: {
            database: true
          },
          appConfig: {
            android: {
              buildNumber: "1",
              buildVersion: "1.0.0",
              minVersion: "1.0.0"
            },
            ios: {
              buildNumber: "1",
              buildVersion: "1.0.0",
              minVersion: "1.0.0"
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid API key',
      type: ErrorResponseDto,
      example: utils.getInvalidApiKeyError()
    }),
    ApiResponse({
      status: 503,
      description: 'API is in maintenance mode or degraded',
      type: ErrorResponseDto,
      example: utils.getErrorResponse(503, 'Service Unavailable', 'API is currently in maintenance mode')
    }),
  );
}

export function ApiGetHealthPing() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Simple ping endpoint' }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Ping response',
      type: ApiResponseDto,
      example: new ApiResponseDto('API is running'),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid API key',
      type: ErrorResponseDto,
      example: utils.getInvalidApiKeyError()
    }),
  );
}

// =================== App Config Decorators ===================

export function ApiCreateAppConfig() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Create application configuration (Android & iOS)' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'App configuration created successfully',
      type: ApiResponseDto<AppConfig>,
      schema: {
        example: new ApiResponseDto(
          'App configuration created successfully',
          {
            _id: '67a1b2c3d4e5f67890123456',
            android: {
              buildNumber: '15',
              buildVersion: '2.5.0',
              minVersion: '2.0.0',
            },
            ios: {
              buildNumber: '8',
              buildVersion: '2.5.0',
              minVersion: '2.0.0',
            },
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          }
        ),
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      type: ErrorResponseDto,
      example: utils.getValidationError([
        'android.buildNumber should not be empty',
        'ios.minVersion must be a string'
      ])
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token missing or invalid',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have permission',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 409,
      description: 'App configuration already exists',
      type: ErrorResponseDto,
      example: utils.getAppConfigExistsError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiGetAppConfig() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get current application configuration' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'App configuration retrieved successfully',
      type: ApiResponseDto<AppConfig>,
      schema: {
        example: new ApiResponseDto(
          'App configuration retrieved successfully',
          {
            _id: '67a1b2c3d4e5f67890123456',
            android: {
              buildNumber: '15',
              buildVersion: '2.5.0',
              minVersion: '2.0.0',
            },
            ios: {
              buildNumber: '8',
              buildVersion: '2.5.0',
              minVersion: '2.0.0',
            },
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          }
        ),
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token missing or invalid',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have permission',
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

export function ApiUpdateAppConfig() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ 
      summary: 'Update application configuration',
      description: 'Partially update Android and/or iOS configuration. Only provided fields will be updated.'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'App configuration updated successfully',
      type: ApiResponseDto<AppConfig>,
      schema: {
        example: new ApiResponseDto(
          'App configuration updated successfully',
          {
            _id: '67a1b2c3d4e5f67890123456',
            android: {
              buildNumber: '16',
              buildVersion: '2.5.1',
              minVersion: '2.0.0',
            },
            ios: {
              buildNumber: '8',
              buildVersion: '2.5.0',
              minVersion: '2.0.0',
            },
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:01.000Z',
          }
        ),
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      type: ErrorResponseDto,
      example: utils.getValidationError(['android.buildNumber must be a string'])
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token missing or invalid',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have permission',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 404,
      description: 'App configuration not found (will create default if not exists)',
      type: ErrorResponseDto,
      example: utils.getAppConfigNotFoundError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiDeleteAppConfig() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Delete application configuration' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'App configuration deleted successfully',
      type: ApiResponseDto,
      schema: {
        example: new ApiResponseDto('App configuration deleted successfully'),
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token missing or invalid',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have permission',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 404,
      description: 'App configuration not found',
      type: ErrorResponseDto,
      example: utils.getAppConfigNotFoundError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}