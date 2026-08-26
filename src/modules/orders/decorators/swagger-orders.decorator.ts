import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { ApiResponseDto } from "src/common/dto/api-response.dto";
import { ErrorResponseDto } from "src/common/dto/error-response.dto";
import { SwaggerResponseUtils } from "src/common/utils/swagger-response-utils";
import { OrderStatus } from "../types/orders.type";

export function ApiCheckout() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ 
      summary: 'Create new orders from checkout',
      description: 'Creates orders grouping products by store. Validates stock and user permissions.'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 201,
      description: 'Orders created successfully',
      type: ApiResponseDto,
      example: utils.getResponseWithOrdersList({
        message: 'Orders created successfully'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
      type: ErrorResponseDto,
      examples: {
        insufficientStock: {
          summary: 'Insufficient stock',
          value: utils.getOrderInsufficientStockError([
            { productId: '60d5f9f8f8b7a12c3c4d5e6f', productName: 'Product A', availableStock: 5, requestedQuantity: 10 }
          ])
        },
        pendingCharges: {
          summary: 'Pending charges',
          value: utils.getBadRequestError('You have pending charges. Please settle them before placing new orders.')
        },
        storeNotActive: {
          summary: 'Store not active',
          value: utils.getBadRequestError('Store "Store Name" is not active')
        },
        productNotAvailable: {
          summary: 'Product not available',
          value: utils.getBadRequestError('Product "Product Name" is not available')
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
      examples: {
        adminCannotOrder: {
          summary: 'Admin cannot order',
          value: utils.getForbiddenError('Admin users cannot place orders')
        },
        ownStore: {
          summary: 'Own store',
          value: utils.getForbiddenError('You cannot place orders to your own store')
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Products not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('Some products not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError('Error creating orders')
    }),
  );
}

export function ApiListOrders() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ 
      summary: 'Get paginated list of orders with filters',
      description: 'Returns orders based on user role and filters. Customers see their own orders, businesses see their orders, etc.'
    }),
    ApiBearerAuth('JWT'),
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
      description: 'Comma-separated list of order statuses to filter',
    }),
    ApiQuery({
      name: 'storeId',
      required: false,
      type: String,
      description: 'Filter by store ID',
    }),
    ApiQuery({
      name: 'customerId',
      required: false,
      type: String,
      description: 'Filter by customer ID (admin only)',
    }),
    ApiQuery({
      name: 'messengerId',
      required: false,
      type: String,
      description: 'Filter by assigned messenger ID',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search by tracking number or notes',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for order creation (ISO string)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for order creation (ISO string)',
    }),
    ApiQuery({
      name: 'hasPendingCharges',
      required: false,
      type: Boolean,
      description: 'Filter orders with pending charges',
    }),
    ApiResponse({
      status: 200,
      description: 'Orders retrieved successfully',
      type: ApiResponseDto,
      example: utils.getResponseWithOrdersList(),
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

export function ApiGetStoreOrders() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ 
      summary: 'Get orders for a specific store',
      description: 'Returns orders for a store. Requires store owner, assigned messenger, or admin permissions.'
    }),
    ApiBearerAuth('JWT'),
    ApiResponse({
      status: 200,
      description: 'Store orders retrieved successfully',
      type: ApiResponseDto,
      example: utils.getResponseWithOrdersList(),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - No access to this store',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('You do not have access to this store orders')
    }),
    ApiResponse({
      status: 404,
      description: 'Store not found',
      type: ErrorResponseDto,
      example: utils.getNotFoundError('Store not found')
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiGetOrder() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ summary: 'Get order details by ID' }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'id',
      required: true,
      type: String,
      description: 'Order ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Order retrieved successfully',
      type: ApiResponseDto,
      example: utils.getResponseWithOrder(),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      type: ErrorResponseDto,
      example: utils.getInvalidTokenError()
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Cannot view this order',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('You do not have permission to view this order')
    }),
    ApiResponse({
      status: 404,
      description: 'Order not found',
      type: ErrorResponseDto,
      example: utils.getOrderNotFoundError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiUpdateOrderStatus() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ 
      summary: 'Update order status',
      description: 'Updates order status with role-based validations and state transitions.'
    }),
    ApiBearerAuth('JWT'),
    ApiQuery({
      name: 'id',
      required: true,
      type: String,
      description: 'Order ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Order status updated successfully',
      type: ApiResponseDto,
      example: utils.getResponseWithOrder({
        message: 'Order status updated to in_preparation'
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
      type: ErrorResponseDto,
      examples: {
        invalidTransition: {
          summary: 'Invalid transition',
          value: utils.getBadRequestError('Invalid status transition from requested to completed')
        },
        missingReason: {
          summary: 'Missing reason',
          value: utils.getBadRequestError('Reason is required for cancellation or abortion')
        },
        cannotCancel: {
          summary: 'Cannot cancel',
          value: utils.getBadRequestError('Cannot cancel order once it is on the way')
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
      description: 'Forbidden - Cannot update this order',
      type: ErrorResponseDto,
      examples: {
        notOwner: {
          summary: 'Not owner/manager',
          value: utils.getForbiddenError('Only store owner can update order to this status')
        },
        notMessenger: {
          summary: 'Not messenger',
          value: utils.getForbiddenError('Only assigned messenger can update order to this status')
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: 'Order not found',
      type: ErrorResponseDto,
      example: utils.getOrderNotFoundError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}

export function ApiAssignMessenger() {
  const utils = new SwaggerResponseUtils();
  return applyDecorators(
    ApiOperation({ 
      summary: 'Assign messenger to order',
      description: 'Assigns a messenger to deliver the order. Requires store owner or admin permissions.'
    }),
    ApiBearerAuth('JWT'),    
    ApiResponse({
      status: 200,
      description: 'Messenger assigned successfully',
      type: ApiResponseDto,
      example: utils.getResponseWithOrder({
        _id: '60d5f9f8f8b7a12c3c4d3eTq',
        message: 'Messenger assigned successfully',
        status: OrderStatus.READY_FOR_DELIVERY,
        assignedMessenger: '60d5f9f8f8b7a12c3c4d5e6f',
      }),
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
      type: ErrorResponseDto,
      examples: {
        notMessenger: {
          summary: 'Not messenger',
          value: utils.getBadRequestError('User is not a messenger')
        },
        notAssociated: {
          summary: 'Not associated',
          value: utils.getBadRequestError('Messenger is not associated with this store')
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
      description: 'Forbidden - Cannot assign messenger',
      type: ErrorResponseDto,
      example: utils.getForbiddenError('Only store owner or admin can assign messengers')
    }),
    ApiResponse({
      status: 404,
      description: 'Order not found',
      type: ErrorResponseDto,
      example: utils.getOrderNotFoundError()
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ErrorResponseDto,
      example: utils.getInternalServerError()
    }),
  );
}