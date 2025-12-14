import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { Business } from "../schemas/business.schema";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";
import { CreateBusinessDto } from "../dto/create-business.dto";

export function ApiRequestCreateBusiness() {
  return applyDecorators(
    ApiOperation({ summary: 'Request create a new business by an user with CUSTOMER role' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'The business has been successfully requested',
      type: ApiResponseDto<Business>,
      example: new SwaggerResponseUtils().getResponseWithBusinessResponse({
        message: 'The business has been successfully requested'
      }),
    }),
  );
}

export function ApiUpdateBusinessByOwner() {
  return applyDecorators(
    ApiOperation({ summary: 'Update business (owner only, if passed dto status must be requested or disabled)' }),
    ApiResponse({
      status: 200,
      description: 'Business updated successfully',
      type: ApiResponseDto<Business>,
      example: new SwaggerResponseUtils().getResponseWithBusinessResponse({
        message: 'Business updated successfully'
      })
    }),
  );
}

export function ApiGetBusiness() {
  return applyDecorators(
    ApiOperation({ summary: 'Get business details (owner only)' }),
    ApiResponse({
      status: 200,
      description: 'Business details',
      type: ApiResponseDto<Business>,
      example: new SwaggerResponseUtils().getResponseWithBusinessResponse({}),
    }),
  );
}

export function ApiUpdateBusinessByAdmin() {
  return applyDecorators(
    ApiOperation({ summary: 'Admin: Update any business field' }),
    ApiResponse({
      status: 200,
      description: 'Business updated successfully',
      type: ApiResponseDto<Business>,
      example: new SwaggerResponseUtils().getResponseWithBusinessResponse({
        message: 'Business updated successfully',
      }),
    }),
  );
}