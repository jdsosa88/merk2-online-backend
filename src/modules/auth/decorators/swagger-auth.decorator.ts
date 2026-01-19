import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { UserLoginDto } from "../dto/user-login.dto";
import { GoogleAuthDto } from "../dto/google-auth.dto";
import { VerifyDefaultCodeUserDto } from "../dto/verify-default-code-user.dto";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { VerifyResetCodeDto } from "../dto/verify-reset-code.dto";

export function ApiLogin() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Login into the API as an authenticated user' }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiBody({ type: UserLoginDto }),
    ApiResponse({
      status: 200,
      description: 'User login response',
      type: ApiResponseDto,
      example: utils.getResponseWithLoginResponse('Login completed successfully'),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
      type: ErrorResponseDto,
      example: utils.getValidationError([
        'email must be an email',
        'password must be longer than or equal to 8 characters'
      ])
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      type: ErrorResponseDto,
      examples: {
        invalidApiKey: {
          summary: 'Invalid API key',
          value: utils.getInvalidApiKeyError()
        },
        invalidCredentials: {
          summary: 'Invalid credentials',
          value: utils.getUnauthorizedError('Invalid credentials')
        },
        inactiveUser: {
          summary: 'Inactive user',
          value: utils.getUnauthorizedError('User is not active')
        }
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

export function ApiGoogleAuth() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Login into the API via Google OAuth' }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiBody({ type: GoogleAuthDto }),
    ApiResponse({
      status: 200,
      description: 'User login response',
      type: ApiResponseDto,
      example: utils.getResponseWithLoginResponse('Login completed successfully'),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      type: ErrorResponseDto,
      examples: {
        missingToken: {
          summary: 'Missing token',
          value: utils.getBadRequestError('Google token is required')
        },
        googleEmailNotFound: {
          summary: 'Google email not found',
          value: utils.getBadRequestError('Google user email not found')
        },
        validationError: {
          summary: 'Validation error',
          value: utils.getValidationError(['token should not be empty'])
        }
      }
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      type: ErrorResponseDto,
      examples: {
        invalidApiKey: {
          summary: 'Invalid API key',
          value: utils.getInvalidApiKeyError()
        },
        invalidGoogleToken: {
          summary: 'Invalid Google token',
          value: utils.getUnauthorizedError('Invalid Google token')
        },
        audienceMismatch: {
          summary: 'Client ID mismatch',
          value: utils.getUnauthorizedError('Invalid Google token: Client ID mismatch. Make sure you\'re using the correct Google Client ID in your Flutter app.')
        }
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

export function ApiRefreshToken() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh the expired jwt bearer token when it is expired by passing the refresh jwt token as x-token by header'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiHeader({
      name: 'x-token',
      description: 'Refresh token',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Token refreshed successfully',
      type: ApiResponseDto,
      example: utils.getResponseWithLoginResponse('Token refreshed', false),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      type: ErrorResponseDto,
      example: utils.getBadRequestError('Refresh token could not be saved')
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      type: ErrorResponseDto,
      examples: {
        invalidApiKey: {
          summary: 'Invalid API key',
          value: utils.getInvalidApiKeyError()
        },
        invalidRefreshToken: {
          summary: 'Invalid refresh token',
          value: utils.getUnauthorizedError('Invalid refresh token')
        },
        refreshTokenNotFound: {
          summary: 'Refresh token not found',
          value: utils.getUnauthorizedError('Refresh token not found')
        },
        userNotFound: {
          summary: 'User not found or inactive',
          value: utils.getUnauthorizedError('User not found or inactive')
        }
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

export function ApiLogout() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Logout of the api by deleting the refresh token saved on database'
    }),
    ApiBearerAuth('JWT'),
    ApiHeader({
      name: 'x-token',
      description: 'Refresh token',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'User logout',
      type: ApiResponseDto,
      example: new ApiResponseDto('Logout successful'),
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

export function ApiConfirmAccountActivationCode() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Activate the user and make the API login by passing the id and the activation code by body.'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiBody({ type: VerifyDefaultCodeUserDto }),
    ApiResponse({
      status: 200,
      description: 'User activated and login',
      type: ApiResponseDto,
      example: utils.getResponseWithLoginResponse('Account activated successfully'),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      type: ErrorResponseDto,
      examples: {
        userAlreadyActive: {
          summary: 'User already active',
          value: utils.getBadRequestError('The user is already active')
        },
        invalidActivationCode: {
          summary: 'Invalid activation code',
          value: utils.getBadRequestError('Invalid or expired activation code')
        },
        validationError: {
          summary: 'Validation error',
          value: utils.getValidationError([
            'id must be a mongodb id',
            'code must be a number string',
            'code must be exactly 6 characters'
          ])
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

export function ApiForgotPassword() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Get a verification code for forgotten password by passing the registered user email'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiBody({ type: ForgotPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'User verification code sended',
      type: ApiResponseDto,
      example: new ApiResponseDto("A reset password code has been sent to your email"),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid email',
      type: ErrorResponseDto,
      example: utils.getValidationError(['email must be an email'])
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      type: ErrorResponseDto,
      examples: {
        invalidApiKey: {
          summary: 'Invalid API key',
          value: utils.getInvalidApiKeyError()
        },
        userInactive: {
          summary: 'User is not active',
          value: utils.getUnauthorizedError('User is not active')
        }
      }
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

export function ApiConfirmForgottenPasswordCode() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({
      summary: 'Confirm the forgotten password code and make the API login by passing the email and the verification code by body. The operation is completed on /users/change-forgotten-password by changing the forgotten authenticated user password.'
    }),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for authentication',
      required: true,
    }),
    ApiBody({ type: VerifyResetCodeDto }),
    ApiResponse({
      status: 200,
      description: 'Verification code verified and login',
      type: ApiResponseDto,
      example: utils.getResponseWithLoginResponse('Password reset code is valid'),
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
            'email must be an email',
            'code must be a number string'
          ])
        }
      }
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      type: ErrorResponseDto,
      examples: {
        invalidApiKey: {
          summary: 'Invalid API key',
          value: utils.getInvalidApiKeyError()
        },
        userInactive: {
          summary: 'User is not active',
          value: utils.getUnauthorizedError('User with email is not active')
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('User with email not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}