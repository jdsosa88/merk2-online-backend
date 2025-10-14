import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { Role, User } from "../schemas/user.schema";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";

export function ApiCreate() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new user with CUSTOMER role' }),
    ApiHeader({
          name: 'x-api-key',
          description: 'API Key for authentication',
          required: true,
        }),
    ApiResponse({
      status: 201,
      description: 'User created',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getExampleResponseWithUser(
        'User created, please check your email for the activation code'
      ),
    }),
  );
}

export function ApiFindOne() {
  return applyDecorators(
    ApiOperation({ summary: 'Get the authenticated user' }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'User obtained',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getExampleResponseWithUser(),
    }),
  );
}

export function ApiUpdate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Updates the authenticated user except for the isActive, password and role fields'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'User updated',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getExampleResponseWithUser('User updated'),
    }),
  );
}

export function ApiRequestDeleteVerificationCode() {
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
  );
}

export function ApiRemove() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete the authenticated user sending the requested delete code by query'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'User deleted',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getExampleResponseWithUser('User deleted'),
    }),
  );
}

export function ApiSetPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set the authenticated user password sending the old and new password by body'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'Password changed',
      type: ApiResponseDto<User>,
      example: new ApiResponseDto("Password changed successfully"),
    }),
  );
}

export function ApiChangeForgottenPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reset the forgotten password to the authenticated user sending the requested reset password code and the new password by body'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'Password changed',
      type: ApiResponseDto<User>,
      example: new ApiResponseDto("Password changed successfully"),
    }),
  );
}

export function ApiCreateAdmin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new admin user (only an authenticated admin user can access the endpoint)'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'User created',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getExampleResponseWithUser(
        'Admin user created successfully', Role.ADMIN, true
      )
    }),
  );
}

export function ApiFindOtherUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get other user (only an authenticated user can access the endpoint, resticted for CUSTOMER user role)'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'User obtained',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getExampleResponseWithUser(),
    }),
  );
}

export function ApiFindAll() {
  return applyDecorators(
    ApiOperation({
      summary: 'List users with optional role filter, if role query param is undefined it return all users to any role founds (only an authenticated admin user can access the endpoint)'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'Users List',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getResponseWithUsersList(),
    }),
  );
}

export function ApiUpdateOtherUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update any property of other user, including password, role and isActive fields (only an authenticated admin user can access the endpoint)'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'User updated',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getExampleResponseWithUser('User updated'),
    }),
  );
}

export function ApiRemoveOtherUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete other user (only an authenticated admin user can access the endpoint)'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'User deleted',
      type: ApiResponseDto<User>,
      example: new SwaggerResponseUtils().getExampleResponseWithUser('User deleted'),
    }),
  );
}
