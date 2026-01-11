// src/modules/health/decorators/swagger-health.decorator.ts
import { applyDecorators } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";

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
          version: '0.0.1',
          environment: 'development',
          uptime: 3600,
          dependencies: {
            database: true
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
