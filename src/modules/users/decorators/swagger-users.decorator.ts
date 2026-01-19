import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiQuery, ApiBody } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { User } from "../schemas/user.schema";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";
import { Role } from "../types/users.type";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserAllDto, UpdateUserDto } from "../dto/update-user.dto";
import { SetPasswordDto } from "../dto/set-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";

export function ApiCreate() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Create a new user with CUSTOMER role' }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiBody({ type: CreateUserDto }),
    ApiResponse({
      status: 201,
      description: 'User created',
      type: ApiResponseDto<User>,
      example: utils.getExampleResponseWithUser(
        { message: 'User created, please check your email for the activation code' }
      ),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Validation error',
      type: ErrorResponseDto,
      example: utils.getValidationError([
        'email must be an email',
        'firstName should not be empty',
        'password must be longer than or equal to 8 characters',
        'phone must be a valid phone number'
      ])
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid API key',
      type: ErrorResponseDto,
      example: utils.getInvalidApiKeyError()
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Email already exists',
      type: ErrorResponseDto,
      example: utils.getConflictError('Email already registered')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiFindOne() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get the authenticated user' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'User obtained',
      type: ApiResponseDto<User>,
      example: utils.getExampleResponseWithUser({}),
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
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiUpdate() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Updates the authenticated user except for the isActive, password and role fields'
    }),
    ApiBearerAuth('JWT'),
    ApiBody({ type: UpdateUserAllDto }),
    ApiResponse({
      status: 200,
      description: 'User updated',
      type: ApiResponseDto<User>,
      example: utils.getExampleResponseWithUser({ message: 'User updated' }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      type: ErrorResponseDto,
      examples: {
        validationError: {
          summary: 'Validation error',
          value: utils.getValidationError([
            'email must be an email',
            'firstName must be longer than or equal to 2 characters',
            'phone must be a valid phone number'
          ])
        },
        restrictedField: {
          summary: 'Restricted field',
          value: utils.getBadRequestError('Cannot update isActive, password or role fields through this endpoint')
        },
        invalidRoleChange: {
          summary: 'Invalid role change',
          value: utils.getBadRequestError('Invalid or restricted user role')
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
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Email already exists',
      type: ErrorResponseDto,
      example: utils.getConflictError('Email already in use by another user')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiRequestDeleteVerificationCode() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Send a requested delete code to the authenticated user email'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'Code sended to user email',
      type: ApiResponseDto<User>,
      example: new ApiResponseDto("A delete code has been sent to your email"),
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
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiRemove() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Delete the authenticated user sending the requested delete code by query'
    }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'code',
      required: true,
      description: 'Delete verification code',
      example: '123456'
    }),
    ApiResponse({
      status: 200,
      description: 'User deleted',
      type: ApiResponseDto<User>,
      example: utils.getExampleResponseWithUser({ message: 'User deleted' }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid delete code',
      type: ErrorResponseDto,
      example: utils.getBadRequestError('Invalid or expired activation code')
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
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiSetPassword() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Set the authenticated user password sending the old and new password by body'
    }),
    ApiBearerAuth('JWT'),
    ApiBody({ type: SetPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Password changed',
      type: ApiResponseDto<User>,
      example: new ApiResponseDto("Password changed successfully"),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      type: ErrorResponseDto,
      examples: {
        samePassword: {
          summary: 'Same password',
          value: utils.getBadRequestError('The old and new passwords must be different')
        },
        incorrectPassword: {
          summary: 'Incorrect password',
          value: utils.getBadRequestError('Old password is incorrect')
        },
        validationError: {
          summary: 'Validation error',
          value: utils.getValidationError([
            'oldPassword should not be empty',
            'newPassword must be longer than or equal to 8 characters'
          ])
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
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiChangeForgottenPassword() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Reset the forgotten password to the authenticated user sending the requested reset password code and the new password by body'
    }),
    ApiBearerAuth('JWT'),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Password changed',
      type: ApiResponseDto<User>,
      example: new ApiResponseDto("Password changed successfully"),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      type: ErrorResponseDto,
      examples: {
        invalidResetCode: {
          summary: 'Invalid reset code',
          value: utils.getBadRequestError('Invalid or expired reset password code')
        },
        validationError: {
          summary: 'Validation error',
          value: utils.getValidationError([
            'code must be a number string',
            'newPassword must be longer than or equal to 8 characters'
          ])
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
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiCreateAdmin() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new admin user (only an authenticated admin user can access the endpoint)'
    }),
    ApiBearerAuth('JWT'),
    ApiBody({ type: CreateUserDto }),
    ApiResponse({
      status: 201,
      description: 'User created',
      type: ApiResponseDto<User>,
      example: utils.getExampleResponseWithUser({
        message: 'Admin user created successfully',
        role: Role.ADMIN,
        isAdmin: true
      })
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Validation error',
      type: ErrorResponseDto,
      example: utils.getValidationError([
        'email must be an email',
        'firstName should not be empty',
        'password must be longer than or equal to 8 characters'
      ])
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
      status: 409,
      description: 'Conflict - Email already exists',
      type: ErrorResponseDto,
      example: utils.getConflictError('Email already registered')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiFindOtherUser() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Get other user (only an authenticated user can access the endpoint, resticted for CUSTOMER user role)'
    }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'id',
      required: true,
      description: 'User ID',
      example: '507f1f77bcf86cd799439011'
    }),
    ApiResponse({
      status: 200,
      description: 'User obtained',
      type: ApiResponseDto<User>,
      example: utils.getExampleResponseWithUser({}),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Customer role cannot access other users',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiFindAll() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'List users with optional role filter, if role query param is undefined it return all users to any role founds (only an authenticated admin user can access the endpoint)'
    }),
    ApiBearerAuth('JWT'),
    ApiQuery({ name: 'role', required: false, type: String }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'perPage', required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: 'Users List',
      type: ApiResponseDto,
      example: utils.getResponseWithUsersList(),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid query parameters',
      type: ErrorResponseDto,
      example: utils.getValidationError([
        'page must be a number string',
        'perPage must be a number string'
      ])
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
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiUpdateOtherUser() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Update any property of other user, including password, role and isActive fields (only an authenticated admin user can access the endpoint)'
    }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'id',
      required: true,
      description: 'User ID',
      example: '507f1f77bcf86cd799439011'
    }),
    ApiBody({ type: UpdateUserDto }),
    ApiResponse({
      status: 200,
      description: 'User updated',
      type: ApiResponseDto<User>,
      example: utils.getExampleResponseWithUser({ message: 'User updated' }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      type: ErrorResponseDto,
      examples: {
        validationError: {
          summary: 'Validation error',
          value: utils.getValidationError([
            'email must be an email',
            'role must be a valid enum value'
          ])
        },
        invalidRoleChange: {
          summary: 'Invalid role change',
          value: utils.getBadRequestError('Invalid or restricted user role')
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
      description: 'Forbidden - User is not an admin',
      type: ErrorResponseDto,
      example: utils.getInsufficientPermissionsError()
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Email already exists',
      type: ErrorResponseDto,
      example: utils.getConflictError('Email already in use by another user')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiRemoveOtherUser() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Delete other user (only an authenticated admin user can access the endpoint)'
    }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'id',
      required: true,
      description: 'User ID',
      example: '507f1f77bcf86cd799439011'
    }),
    ApiResponse({
      status: 200,
      description: 'User deleted',
      type: ApiResponseDto<User>,
      example: utils.getExampleResponseWithUser({message: 'User deleted'}),
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
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}