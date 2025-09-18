import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/response.dto";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Login into the API as an authenticated user' }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'User login response',
      type: ApiResponseDto,
      example: new SwaggerResponseUtils().getResponseWithLoginResponse('Login completed successfully'),
    }),
  );
}

export function ApiRefreshToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh the expired jwt bearer token when it is expired by passing the refresh jwt token as x-token by header'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Token refreshed successfully',
      type: ApiResponseDto,
      example: new SwaggerResponseUtils().getResponseWithLoginResponse('Token refreshed', false),
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'Logout of the api by deleting the refresh token saved on database'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'User logout',
      type: ApiResponseDto,
      example: new ApiResponseDto('Logout successful'),
    }),
  );
}
export function ApiConfirmAccountActivationCode() {
  return applyDecorators(
    ApiOperation({
      summary: 'Activate the user and make the API login by passing the id and the activation code by body.'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'User activated and login',
      type: ApiResponseDto,
      example: new SwaggerResponseUtils().getResponseWithLoginResponse('Account activated successfully'),
    }),
  );
}
export function ApiForgotPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a verification code for forgotten password by passing the registered user email'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'User verification code sended',
      type: ApiResponseDto,
      example: new ApiResponseDto("A reset password code has been sent to your email"),
    }),
  );
}
export function ApiConfirmForgottenPasswordCode() {
  return applyDecorators(
    ApiOperation({
      summary: 'Confirm the forgotten password code and make the API login by passing the email and the verification code by body. The operation is completed on /users/change-forgotten-password by changing the forgotten authenticated user password.'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Verification code verified and login',
      type: ApiResponseDto,
      example: new SwaggerResponseUtils().getResponseWithLoginResponse('Password reset code is valid'),
    }),
  );
}
