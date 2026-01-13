import { applyDecorators } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

export function ApiGetHealthStatus() {
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
      status: 503,
      description: 'API is in maintenance mode or degraded'
    }),
  );
}

export function ApiGetHealthPing() {
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
      schema: {
        example: {
          message: 'success',
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      }
    }),
  );
}

// =================== App Config Decorators ===================

export function ApiCreateAppConfig() {
  return applyDecorators(
    ApiOperation({ summary: 'Create application configuration (Android & iOS)' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'App configuration created successfully',
      schema: {
        example: {
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
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'App configuration already exists',
      schema: {
        example: {
          statusCode: 409,
          message: 'App configuration already exists. Use update instead.',
          error: 'Conflict'
        }
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      schema: {
        example: {
          statusCode: 400,
          message: [
            'android.buildNumber should not be empty',
            'ios.minVersion must be a string'
          ],
          error: 'Bad Request'
        }
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token missing or invalid',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have permission',
    }),
  );
}

export function ApiGetAppConfig() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current application configuration' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'App configuration retrieved successfully',
      schema: {
        example: {
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
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token missing or invalid',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have permission',
    }),
  );
}

export function ApiUpdateAppConfig() {
  return applyDecorators(
    ApiOperation({ 
      summary: 'Update application configuration',
      description: 'Partially update Android and/or iOS configuration. Only provided fields will be updated.'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'App configuration updated successfully',
      schema: {
        example: {
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
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      schema: {
        example: {
          statusCode: 400,
          message: [
            'android.buildNumber must be a string'
          ],
          error: 'Bad Request'
        }
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token missing or invalid',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have permission',
    }),
    ApiResponse({
      status: 404,
      description: 'App configuration not found (will create default if not exists)',
    }),
  );
}

export function ApiDeleteAppConfig() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete application configuration' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 204,
      description: 'App configuration deleted successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token missing or invalid',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have permission',
    }),
    ApiResponse({
      status: 404,
      description: 'App configuration not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'App configuration not found',
          error: 'Not Found'
        }
      },
    }),
  );
}