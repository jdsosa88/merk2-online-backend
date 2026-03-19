import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, getSchemaPath, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { Business } from "../schemas/business.schema";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";
import { AddEmployeeResponseDto } from "../dto/add-employee-response.dto";
import { EmploymentRequestResponseDto } from "../dto/employment-request-response.dto";
import { PaginatedListDto } from "src/common/dto/paginated-list.dto";

export function ApiRequestCreateBusiness() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Request create a new business by an user with CUSTOMER role' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'The business has been successfully requested',
      type: ApiResponseDto<Business>,
      example: utils.getResponseWithBusinessResponse({
        message: 'The business has been successfully requested'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
      type: ErrorResponseDto,
      example: utils.getBadRequestError(['Name should not be empty'])
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

export function ApiUpdateBusinessByOwner() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Update business (owner only, if passed dto status must be requested or disabled)' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'Business updated successfully',
      type: ApiResponseDto<Business>,
      example: utils.getResponseWithBusinessResponse({
        message: 'Business updated successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error or business status invalid',
      type: ErrorResponseDto,
      examples: {
        businessNotAccepted: { summary: 'Business not accepted', value: utils.getBusinessNotAcceptedError() },
        invalidStatusUpdate: { summary: 'Invalid status update', value: utils.getBusinessInvalidStatusError() },
        invalidCategory: { summary: 'Invalid category', value: utils.getBusinessInvalidCategoryError() },
        failedUpdate: { summary: 'Failed update', value: utils.getBadRequestError('Failed update operation') },
        validationError: { summary: 'Validation error', value: utils.getValidationError(['Name should not be empty']) }
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
      description: 'Forbidden - User is not the owner of the business',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('You are not the owner of this business')
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

export function ApiGetBusiness() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get business details (owner only)' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'Business details',
      type: ApiResponseDto<Business>,
      example: utils.getResponseWithBusinessResponse({}),
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

export function ApiGetBusinessesByOwnerAsAdmin() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get all businesses owned by the authenticated user' }),
    ApiBearerAuth('JWT'),
    ApiQuery({type: String, name: 'ownerId', example: "69554d877f1dd0e6bdawq3r1"}),
    ApiResponse({
      status: 200,
      description: 'List of businesses owned by the user',
      schema: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', example: new Date().toISOString() },
          message: { type: 'string', example: 'Businesses retrieved successfully' },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(Business) }
          }
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
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiGetBusinessesByOwner() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get all businesses owned by the authenticated user' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'List of businesses owned by the user',
      schema: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', example: new Date().toISOString() },
          message: { type: 'string', example: 'Businesses retrieved successfully' },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(Business) }
          }
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
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiUpdateBusinessByAdmin() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Admin: Update any business field' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'Business updated successfully',
      type: ApiResponseDto<Business>,
      example: utils.getResponseWithBusinessResponse({
        message: 'Business updated successfully',
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
      type: ErrorResponseDto,
      example: utils.getBadRequestError('Failed update operation')
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User is not an admin',
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

export function ApiRemoveBusinessCategories() {
  return applyDecorators(
    ApiOperation({ 
      summary: 'Remove categories from a business',
      description: 'Removes the association between a business and specific categories. Does not delete the categories themselves.'
    }),
    ApiQuery({
      name: 'id',
      required: true,
      type: String,
      description: 'Business ID',
    }),    
    ApiResponse({
      status: 200,
      description: 'Categories removed successfully',
      type: Business,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid request or categories not associated with business',
    }),
    ApiResponse({
      status: 403,
      description: 'User is not the owner of the business',
    }),
    ApiResponse({
      status: 404,
      description: 'Business not found',
    }),
  );
}

export const ApiRequestDeleteBusiness = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Request business deletion (owner only)' }),    
    ApiResponse({
      status: 200,
      description: 'Business deletion requested successfully',
      type: ApiResponseDto,
    }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 404, description: 'Business not found' }),
  );

export const ApiDeleteBusiness = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete business (admin only)' }),    
    ApiResponse({
      status: 204,
      description: 'Business deleted successfully',
    }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 404, description: 'Business not found' }),
  );

export function ApiAddEmployee() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Add an employee to a business (owner or admin only)' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', required: true, description: 'Business ID' }),
    ApiResponse({
      status: 200,
      description: 'Employee added successfully',
      type: ApiResponseDto<AddEmployeeResponseDto>,
      example: utils.getResponseWithBusinessResponse({
        message: 'Employee added successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
      type: ErrorResponseDto,
      examples: {
        businessNotAccepted: {
          summary: 'Business not accepted',
          value: utils.getBadRequestError('Business must have status ACCEPTED to add employees')
        },
        missingNames: {
          summary: 'Missing names',
          value: utils.getBadRequestError('First name and last name are required to create a new user')
        },
        invalidEmployeeType: {
          summary: 'Invalid employee type',
          value: utils.getBadRequestError('Invalid employee type or user role')
        },
        managerAlreadyAssigned: {
          summary: 'Manager already assigned',
          value: utils.getEmployeeAlreadyAssignedError()
        },
        differentProvider: {
          summary: 'Different provider',
          value: utils.getBadRequestError('Messenger is already working for a different provider')
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
      description: 'Forbidden - Only business owner or admin can add employees',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('Only business owner or admin can add employees')
    }),
    ApiResponse({
      status: 404,
      description: 'Business not found',
      type: ErrorResponseDto,
      example: utils.getBusinessNotFoundError()
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict',
      type: ErrorResponseDto,
      examples: {
        employeeExists: { summary: 'Employee exists', value: utils.getEmployeeAlreadyExistsError() },
        requestExists: { summary: 'Request exists', value: utils.getEmploymentRequestExistsError() },
        messengerAssociated: { summary: 'Messenger associated', value: utils.getConflictError('Messenger is already associated with this business') }
      }
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiRespondEmploymentRequest() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Respond to an employment request (accept/reject)' }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'id', required: true, description: 'Employment request ID' }),
    ApiResponse({
      status: 200,
      description: 'Employment request accepted/rejected successfully',
      type: ApiResponseDto<EmploymentRequestResponseDto>,
      example: utils.getResponseWithBusinessResponse({
        message: 'Employment request accepted'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
      type: ErrorResponseDto,
      examples: {
        requestProcessed: {
          summary: 'Request processed',
          value: utils.getBadRequestError('Request is already processed')
        },
        requestExpired: {
          summary: 'Request expired',
          value: utils.getEmploymentRequestExpiredError()
        },
        notCustomer: {
          summary: 'Not customer',
          value: utils.getBadRequestError('Only customers can accept employment requests')
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
      description: 'Forbidden - You can only respond to your own employment requests',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('You can only respond to your own employment requests')
    }),
    ApiResponse({
      status: 404,
      description: 'Employment request not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('Employment request not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiListBusiness() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a paginated list of businesses with optional filters' }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number, default is 1',
    }),
    ApiQuery({
      name: 'perPage',
      required: false,
      type: Number,
      description: 'Number of items per page, default is 25',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      type: String,
      description: 'Comma-separated list of statuses to filter (REQUESTED, ACCEPTED, PENDING, DISABLED)',
    }),
    ApiQuery({
      name: 'name',
      required: false,
      type: String,
      description: 'Partial name of the business to search for',
    }),
    ApiQuery({
      name: 'categories',
      required: false,
      type: String,
      description: 'Comma-separated list of category IDs to filter businesses',
    }),
    ApiQuery({
      name: 'owner',
      required: false,
      type: String,
      description: 'Owner ID to filter businesses',
    }),
    ApiResponse({
      status: 200,
      description: 'Returns a paginated list of businesses',
      type: PaginatedListDto<Business>,
    }),
  );
}

export function ApiUploadBusinessImages() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Upload business pictures (pic and/or portalPic)' }),
    ApiBearerAuth('JWT'),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          pic: {
            type: 'string',
            format: 'binary',
            description: 'Business main picture (max 1 file)',
          },
          portalPic: {
            type: 'string',
            format: 'binary',
            description: 'Business portal picture (max 1 file)',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Images uploaded successfully',
      type: ApiResponseDto<Business>,
      example: utils.getResponseWithBusinessResponse({ message: 'Business images updated' }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - No valid images or business not found',
      type: ErrorResponseDto,
      examples: {
        noImages: { summary: 'No images', value: utils.getBadRequestError('There are not valid images data to update') },
        businessNotFound: { summary: 'Business not found', value: utils.getBusinessNotFoundError() },
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
      description: 'Forbidden - Only owner or admin can update images',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('Only business owner or admin can upload images'),
    }),
    ApiResponse({
      status: 404,
      description: 'Business not found',
      type: ErrorResponseDto,
      example: utils.getBusinessNotFoundError(),
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError(),
    }),
  );
}

export function ApiDeleteBusinessImages() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Delete business pictures (pic, portalPic or both)' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'id',
      required: true,
      type: String,
      description: 'Business ID',
    }),
    ApiQuery({
      name: 'imageToDelete',
      required: true,
      enum: ['pic', 'portalPic', 'both'],
      description: 'Which image(s) to delete',
    }),
    ApiResponse({
      status: 200,
      description: 'Images deleted successfully',
      type: ApiResponseDto<Business>,
      example: utils.getResponseWithBusinessResponse({ message: 'Business images deleted successfully' }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid image type or no image to delete',
      type: ErrorResponseDto,
      examples: {
        invalidType: { summary: 'Invalid type', value: utils.getBadRequestError('Invalid imageToDelete value') },
        noImage: { summary: 'No image', value: utils.getBadRequestError('No image to delete for the specified type') },
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
      description: 'Forbidden - Only owner or admin can delete images',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('Only business owner or admin can delete images'),
    }),
    ApiResponse({
      status: 404,
      description: 'Business not found',
      type: ErrorResponseDto,
      example: utils.getBusinessNotFoundError(),
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError(),
    }),
  );
}