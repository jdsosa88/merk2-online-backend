import { Injectable } from "@nestjs/common";
import { ApiResponseDto } from "../dto/api-response.dto";
import { Role } from "src/modules/users/types/users.type";
import { PaginatedListDto } from "../dto/paginated-list.dto";
import { ProductType } from "src/modules/products/schemas/product.schema";
import { ErrorResponseDto } from "../dto/error-response.dto";

type UserDataType = {
  message?: string,
  role?: Role,
  isAdmin?: boolean,
}

type BusinessDataType = {
  message?: string;
}

type CategoryDataType = {
  message?: string;
  isRoot?: boolean;
  withHierarchy?: boolean;
  withChildren?: boolean;
}

type ProductDataType = {
  message?: string;
  type?: ProductType;
  withAddons?: boolean;
  withParent?: boolean;
}

@Injectable()
export class SwaggerResponseUtils {
  getExampleResponseWithUser({ message, role = Role.CUSTOMER, isAdmin = false }: UserDataType) {
    const exampleUser: Object = {
      firstName: "User",
      lastName: "Example",
      email: "user.example@email.com",
      phone: "+5351657628",
      isActive: isAdmin,
      role: role,
      _id: "68bec9fdb83564195e6aa63d",
      createdAt: "2025-09-08T12:20:13.346Z",
      updatedAt: "2025-09-08T12:20:13.346Z",
      isPhoneVerified: isAdmin,
    };
    if (message) {
      return new ApiResponseDto(message, exampleUser);
    } else {
      return new ApiResponseDto(exampleUser);
    }
  }

  getResponseWithUsersList() {
    const listData: PaginatedListDto<Object> = {
      items: [
        {
          _id: "68b97b7bf6c2528ac3e9063e",
          firstName: "Provider",
          lastName: "User",
          email: "provider@test.com",
          phone: "+1234567892",
          isActive: true,
          role: "PROVIDER",
          createdAt: "2025-09-04T11:43:55.294Z",
          updatedAt: "2025-09-04T11:43:55.294Z",
          isPhoneVerified: false
        },
        {
          _id: "68b97b7bf6c2528ac3e90641",
          firstName: "Messenger",
          lastName: "User",
          email: "messenger@test.com",
          phone: "+1234567893",
          isActive: true,
          role: "MESSENGER",
          createdAt: "2025-09-04T11:43:55.545Z",
          updatedAt: "2025-09-04T11:43:55.545Z",
          isPhoneVerified: false
        },
      ],
      total: 12,
      page: 2,
      perPage: 10,
      totalPages: 2
    };

    return new ApiResponseDto(listData);
  }

  getResponseWithLoginResponse(message?: string, withUser: boolean = true) {
    const loginResponse: any = {};
    if (withUser) {
      loginResponse.user = {
        firstName: "User",
        lastName: "Example",
        email: "user.example@email.com",
        phone: "+5351657628",
        isActive: true,
        role: Role.CUSTOMER,
        _id: "68bec9fdb83564195e6aa63d",
        createdAt: "2025-09-08T12:20:13.346Z",
        updatedAt: "2025-09-08T12:20:13.346Z",
        isPhoneVerified: false
      };
    }
    loginResponse.tokens = {
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGI5N2I3YWY2YzI1MjhhYzNlOTA2MzgiLCJpYXQiOjE3NTczNDQ5MDIsImV4cCI6MTc1Nzk0OTcwMn0.QZoMlIjJd7D-BnaGe5-nIYX7YCSFJPtFniIP-KQgcPc",
      refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGI5N2I3YWY2YzI1MjhhYzNlOTA2MzgiLCJpYXQiOjE3NTczNDQ5MDIsImV4cCI6MTc1OTkzNjkwMn0.TQ9p_uaeh59IQWEqZ1T9tUYZ76k626WojI18112L-H8"
    };
    return new ApiResponseDto(message, loginResponse);
  }

  getResponseWithBusinessResponse({ message }: BusinessDataType) {
    const businessExample: any = {
      "name": "My business name",
      "description": "A description of the business",
      "geolocation": {
        "address": "123 Main St",
        "latitude": -34.6037,
        "longitude": -58.3816
      },
      "phones": [
        "123-456-7890",
        "098-765-4321"
      ],
      "week": [
        null
      ],
      "owner": "693ee796035fe383f785f91b",
      "status": "requested",
      "messengerAssigmentType": "automatic",
      "_id": "693f367e11e9bb44f52951de",
      "createdAt": "2025-12-14T22:13:18.825Z",
      "updatedAt": "2025-12-14T22:13:18.825Z",
      "__v": 0
    }
    return new ApiResponseDto(message, businessExample);
  }

  getExampleResponseWithProduct({ message, type = ProductType.SIMPLE, withAddons = false, withParent = false }: ProductDataType) {
    const exampleProduct: any = {
      _id: "65a1b2c3d4e5f67890123456",
      name: "iPhone 15 Pro",
      description: "Smartphone Apple con chip A17 Pro y cámara triple",
      type: type,
      brand: "Apple",
      price: 1299.99,
      images: [
        {
          url: "https://example.com/images/iphone1.jpg",
          alt: "iPhone 15 Pro frontal",
          order: 1
        }
      ],
      discountValue: 0,
      discountPercent: 10,
      finalPrice: 1169.99,
      warranty: "1 año de garantía",
      size: "6.1 pulgadas",
      colors: ["black", "white"],
      weight: "187g",
      stock: 50,
      isAvailable: true,
      sku: "IPH15-PRO-001",
      business: {
        _id: "60d21b4667d0d8992e610c85",
        name: "Tech Store"
      },
      category: {
        _id: "60d21b4667d0d8992e610c86",
        name: "Smartphones",
        level: 0
      },
      timesOrdered: 100,
      averageRating: 4.5,
      totalReviews: 200,
      isActive: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    };

    if (withAddons) {
      exampleProduct.addons = [
        {
          _id: "65a1b2c3d4e5f67890123457",
          name: "Funda Protectora",
          price: 49.99,
          finalPrice: 49.99,
          sku: "CASE-001",
          isAvailable: true
        }
      ];
    }

    if (withParent) {
      exampleProduct.parentProduct = {
        _id: "65a1b2c3d4e5f67890123456",
        name: "iPhone 15 Pro",
        price: 1299.99,
        finalPrice: 1169.99,
        sku: "IPH15-PRO-001"
      };
    }

    if (message) {
      return new ApiResponseDto(message, exampleProduct);
    } else {
      return new ApiResponseDto(exampleProduct);
    }
  }

  getResponseWithProductsList() {
    const listData: PaginatedListDto<any> = {
      items: [
        {
          _id: "65a1b2c3d4e5f67890123456",
          name: "iPhone 15 Pro",
          type: "simple",
          price: 1299.99,
          finalPrice: 1169.99,
          sku: "IPH15-PRO-001",
          business: {
            _id: "60d21b4667d0d8992e610c85",
            name: "Tech Store"
          },
          category: {
            _id: "60d21b4667d0d8992e610c86",
            name: "Smartphones",
            level: 0
          },
          stock: 50,
          isAvailable: true,
          isActive: true,
          timesOrdered: 100,
          averageRating: 4.5
        },
        {
          _id: "65a1b2c3d4e5f67890123457",
          name: "Funda Protectora",
          type: "addon",
          price: 49.99,
          finalPrice: 49.99,
          sku: "CASE-001",
          business: {
            _id: "60d21b4667d0d8992e610c85",
            name: "Tech Store"
          },
          category: {
            _id: "60d21b4667d0d8992e610c87",
            name: "Accesorios",
            level: 0
          },
          stock: 100,
          isAvailable: true,
          isActive: true,
          timesOrdered: 50,
          averageRating: 4.0
        }
      ],
      total: 2,
      page: 1,
      perPage: 10,
      totalPages: 1
    };

    return new ApiResponseDto(listData);
  }

  getExampleResponseWithCategory({ message, isRoot = false, withHierarchy = false, withChildren = false }: CategoryDataType) {
    const exampleCategory: any = {
      _id: "60d21b4667d0d8992e610c86",
      name: "Electronics",
      level: isRoot ? 0 : 2,
      isRoot: isRoot,
      isActive: true,
      description: "Electronic devices and gadgets",
      icon: "electronics-icon",
      color: "#FF5733",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    };

    // Agregar jerarquía si se solicita
    if (withHierarchy) {
      exampleCategory.parents = isRoot ? [] : [
        {
          _id: "60d21b4667d0d8992e610c85",
          name: "Home Appliances",
          level: 1,
          isRoot: false
        },
        {
          _id: "60d21b4667d0d8992e610c84",
          name: "Appliances",
          level: 0,
          isRoot: true
        }
      ];

      exampleCategory.subcategories = withChildren ? [
        {
          _id: "60d21b4667d0d8992e610c87",
          name: "Smartphones",
          subcategories: [],
          level: exampleCategory.level + 1,
          isActive: true
        },
        {
          _id: "60d21b4667d0d8992e610c88",
          name: "Laptops",
          subcategories: [
            {
              _id: "60d21b4667d0d8992e610c89",
              name: "Gaming Laptops",
              subcategories: [],
              level: exampleCategory.level + 2,
              isActive: true
            }
          ],
          level: exampleCategory.level + 1,
          isActive: true
        }
      ] : [];
    }

    if (message) {
      return new ApiResponseDto(message, exampleCategory);
    } else {
      return new ApiResponseDto(exampleCategory);
    }
  }

  getResponseWithCategoriesList({ isRoot = false } = {}) {
    const listData: PaginatedListDto<any> = {
      items: [
        {
          _id: "60d21b4667d0d8992e610c84",
          name: "Electronics",
          level: isRoot ? 0 : 2,
          isRoot: isRoot,
          isActive: true,
          description: "Electronic devices",
          icon: "electronics",
          color: "#FF5733",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          _id: "60d21b4667d0d8992e610c85",
          name: "Home & Garden",
          level: isRoot ? 0 : 2,
          isRoot: isRoot,
          isActive: true,
          description: "Home and garden items",
          icon: "home",
          color: "#33FF57",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          _id: "60d21b4667d0d8992e610c86",
          name: "Clothing",
          level: isRoot ? 0 : 2,
          isRoot: isRoot,
          isActive: false,
          description: "Clothing items",
          icon: "clothing",
          color: "#3357FF",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ],
      total: 3,
      page: 1,
      perPage: 10,
      totalPages: 1
    };

    return new ApiResponseDto(listData);
  }

  getExampleResponseWithCategoryTree() {
    const treeExample = {
      _id: "60d21b4667d0d8992e610c84",
      name: "Electronics",
      level: 0,
      isRoot: true,
      isActive: true,
      description: "Electronic devices and gadgets",
      icon: "electronics-icon",
      color: "#FF5733",
      subcategories: [
        {
          _id: "60d21b4667d0d8992e610c85",
          name: "Computers",
          level: 1,
          isRoot: false,
          isActive: true,
          description: "Computers and accessories",
          icon: "computer",
          color: "#33FF57",
          subcategories: [
            {
              _id: "60d21b4667d0d8992e610c86",
              name: "Laptops",
              level: 2,
              isRoot: false,
              isActive: true,
              description: "Portable computers",
              icon: "laptop",
              color: "#5733FF",
              subcategories: [
                {
                  _id: "60d21b4667d0d8992e610c87",
                  name: "Gaming Laptops",
                  level: 3,
                  isRoot: false,
                  isActive: true,
                  description: "High-performance gaming laptops",
                  icon: "gaming",
                  color: "#FF33A1",
                  subcategories: []
                }
              ]
            }
          ]
        }
      ]
    };

    return new ApiResponseDto(treeExample);
  }

  getErrorResponse(statusCode: number, error: string, message: string | string[], data?: any): ErrorResponseDto {
    const errorResponse: ErrorResponseDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error,
      message: Array.isArray(message) ? message[0] : message,
      data
    };
    return errorResponse;
  }

  getUnauthorizedError(message: string = 'Unauthorized'): ErrorResponseDto {
    return this.getErrorResponse(401, 'Unauthorized', message);
  }

  getForbiddenError(message: string = 'Forbidden resource'): ErrorResponseDto {
    return this.getErrorResponse(403, 'Forbidden', message);
  }

  getNotFoundError(message: string = 'Resource not found'): ErrorResponseDto {
    return this.getErrorResponse(404, 'Not Found', message);
  }

  getBadRequestError(message: string | string[]): ErrorResponseDto {
    return this.getErrorResponse(400, 'Bad Request', message);
  }

  getConflictError(message: string): ErrorResponseDto {
    return this.getErrorResponse(409, 'Conflict', message);
  }

  getUnprocessableEntityError(message: string): ErrorResponseDto {
    return this.getErrorResponse(422, 'Unprocessable Entity', message);
  }

  getInternalServerError(message: string = 'Internal server error'): ErrorResponseDto {
    return this.getErrorResponse(500, 'Internal Server Error', message);
  }

  getValidationError(messages: string[]): ErrorResponseDto {
    return this.getBadRequestError(messages);
  }

  getInsufficientPermissionsError(): ErrorResponseDto {
    return this.getForbiddenError('Insufficient permissions');
  }

  getInvalidApiKeyError(): ErrorResponseDto {
    return this.getUnauthorizedError('Invalid or missing API key');
  }

  getInvalidTokenError(message: string = 'Authentication error'): ErrorResponseDto {
    return this.getUnauthorizedError(message);
  }

  getInactiveUserError(): ErrorResponseDto {
    return this.getUnauthorizedError('Inactive user');
  }

  // Métodos específicos para business
  getBusinessNotFoundError(): ErrorResponseDto {
    return this.getNotFoundError('Business not found');
  }

  getBusinessNotAcceptedError(): ErrorResponseDto {
    return this.getBadRequestError('Your business have not accepted status yet');
  }

  getBusinessInvalidStatusError(): ErrorResponseDto {
    return this.getBadRequestError('Business status can only be updated when status is requested or disabled');
  }

  getBusinessInvalidCategoryError(): ErrorResponseDto {
    return this.getBadRequestError('You have at least an invalid category id');
  }

  // Métodos específicos para categories
  getCategoryConflictError(name: string): ErrorResponseDto {
    return this.getConflictError(`Category with name "${name}" already exists`);
  }

  getCategoryNotFoundError(id: string): ErrorResponseDto {
    return this.getNotFoundError(`Category with ID ${id} not found`);
  }

  getCategoryHasSubcategoriesError(): ErrorResponseDto {
    return this.getBadRequestError('Cannot delete category with subcategories');
  }

  // Métodos específicos para products
  getProductSkuConflictError(sku: string): ErrorResponseDto {
    return this.getConflictError(`Product with SKU "${sku}" already exists`);
  }

  getProductNotFoundError(id: string): ErrorResponseDto {
    return this.getNotFoundError(`Product with ID ${id} not found`);
  }

  getProductSkuNotFoundError(sku: string): ErrorResponseDto {
    return this.getNotFoundError(`Product with SKU ${sku} not found`);
  }

  getProductInvalidAddonsError(): ErrorResponseDto {
    return this.getBadRequestError('One or more addons are invalid or not of type ADDON');
  }

  getProductInsufficientStockError(): ErrorResponseDto {
    return this.getBadRequestError('Insufficient stock');
  }

  // Métodos específicos para employees
  getEmployeeAlreadyExistsError(): ErrorResponseDto {
    return this.getConflictError('Employee already exists');
  }

  getEmployeeAlreadyAssignedError(): ErrorResponseDto {
    return this.getBadRequestError('Manager is already assigned to a business');
  }

  getEmploymentRequestExistsError(): ErrorResponseDto {
    return this.getConflictError('A pending employment request already exists for this user');
  }

  getEmploymentRequestExpiredError(): ErrorResponseDto {
    return this.getBadRequestError('Employment request has expired');
  }

  // Métodos específicos para app-config
  getAppConfigExistsError(): ErrorResponseDto {
    return this.getConflictError('App configuration already exists. Use update instead.');
  }

  getAppConfigNotFoundError(): ErrorResponseDto {
    return this.getNotFoundError('App configuration not found');
  }

  // Métodos específicos para orders
  getResponseWithOrder(additionalData: any = {}): any {
    const { message, ...orderData } = additionalData;
    const orderExample = {
      _id: '60d5f9f8f8b7a12c3c4d5e6f',
      customer: '60d5f9f8f8b7a12c3c4d5e6f',
      business: '60d5f9f8f8b7a12c3c4d5e70',
      items: [
        {
          product: '60d5f9f8f8b7a12c3c4d5e71',
          quantity: 2,
          pricePerUnit: 29.99,
          totalPrice: 59.98,
          productName: 'Product A',
          productSku: 'PROD-A-001'
        }
      ],
      subtotal: 59.98,
      deliveryCharge: 5.00,
      additionalCharges: [
        {
          type: 'tax',
          amount: 6.00,
          description: '10% sales tax'
        }
      ],
      total: 70.98,
      status: 'requested',
      hasPendingCharges: false,
      createdAt: '2024-12-01T10:30:00.000Z',
      updatedAt: '2024-12-01T10:30:00.000Z',
      ...orderData
    };

    return {
      timestamp: new Date().toISOString(),
      message: message || 'Success',
      data: orderExample
    };
  }

  getResponseWithOrdersList(additionalData: any = {}): any {
    const ordersListExample = {
      items: [
        {
          _id: '60d5f9f8f8b7a12c3c4d5e6f',
          customer: { _id: '60d5f9f8f8b7a12c3c4d5e6f', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          business: { _id: '60d5f9f8f8b7a12c3c4d5e70', name: 'Business A' },
          items: [],
          subtotal: 59.98,
          deliveryCharge: 5.00,
          total: 70.98,
          status: 'requested',
          hasPendingCharges: false,
          createdAt: '2024-12-01T10:30:00.000Z'
        }
      ],
      total: 1,
      page: 1,
      perPage: 25,
      totalPages: 1,
      ...additionalData
    };

    return {
      timestamp: new Date().toISOString(),
      message: additionalData.message || 'Success',
      data: ordersListExample
    };
  }

  getOrderInsufficientStockError(outOfStockItems: any[]): any {
    return {
      timestamp: new Date().toISOString(),
      statusCode: 400,
      error: 'Bad Request',
      message: 'Insufficient stock for some products',
      data: outOfStockItems
    };
  }

  getOrderNotFoundError(): any {
    return {
      timestamp: new Date().toISOString(),
      statusCode: 404,
      error: 'Not Found',
      message: 'Order not found',
      data: null
    };
  }

}