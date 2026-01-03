import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { Business } from "../schemas/business.schema";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";
import { AddEmployeeResponseDto } from "../dto/add-employee-response.dto";
import { EmploymentRequestResponseDto } from "../dto/employment-request-response.dto";

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

export function ApiAddEmployee() {
  return applyDecorators(
    ApiOperation({ summary: 'Add an employee to a business (owner or admin only)' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', required: true, description: 'Business ID' }),
    ApiResponse({
      status: 200,
      description: 'Employee added successfully',
      type: ApiResponseDto<AddEmployeeResponseDto>,
      example: new SwaggerResponseUtils().getResponseWithBusinessResponse({
        message: 'Employee added successfully'
      }),
    }),
    ApiResponse({ status: 404, description: 'Business not found' }),
    ApiResponse({ status: 400, description: 'Business must have status ACCEPTED to add employees' }),
    ApiResponse({ status: 403, description: 'Only business owner or admin can add employees' }),
    ApiResponse({ status: 409, description: 'Employee already exists or pending request exists' }),
  );
}

export function ApiRespondEmploymentRequest() {
  return applyDecorators(
    ApiOperation({ summary: 'Respond to an employment request (accept/reject)' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', required: true, description: 'Employment request ID' }),
    ApiResponse({
      status: 200,
      description: 'Employment request accepted/rejected successfully',
      type: ApiResponseDto<EmploymentRequestResponseDto>,
      example: new SwaggerResponseUtils().getResponseWithBusinessResponse({
        message: 'Employment request accepted'
      }),
    }),
    ApiResponse({ status: 404, description: 'Employment request not found' }),
    ApiResponse({ status: 403, description: 'You can only respond to your own employment requests' }),
    ApiResponse({ status: 400, description: 'Request is already processed or has expired' }),
  );
}