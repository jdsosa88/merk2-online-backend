import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      }),
    }),
  } as any;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    // Reset the mock before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow public routes without authentication', async () => {
      // Mock the route as public
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should check public decorator override correctly', async () => {
      // Test when public decorator is not present (undefined)
      reflector.getAllAndOverride.mockReturnValue(undefined);

      // Mock the parent canActivate method
      const mockSuperCanActivate = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      mockSuperCanActivate.mockResolvedValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });

    it('should delegate to parent AuthGuard when route is not public', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      // Mock the parent canActivate method
      const mockSuperCanActivate = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      const mockPromise = Promise.resolve(true);
      mockSuperCanActivate.mockReturnValue(mockPromise);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(mockPromise);
    });

    it('should handle false public decorator value', async () => {
      // Test when public decorator is explicitly set to false
      reflector.getAllAndOverride.mockReturnValue(false);

      const mockSuperCanActivate = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      mockSuperCanActivate.mockResolvedValue(true);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
        role: 'CUSTOMER',
      };

      const result = guard.handleRequest(null, mockUser, null, mockExecutionContext);

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when user not found', () => {
      const error = new Error('Token invalid');

      expect(() => {
        guard.handleRequest(error, null, null, mockExecutionContext);
      }).toThrow(new UnauthorizedException('User not found'));
    });

    it('should handle authentication errors properly', () => {
      const error = new Error('Token expired');
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
      };
      const info = {
        message: 'Token has expired',
      };

      expect(() => {
        guard.handleRequest(error, mockUser, info, mockExecutionContext);
      }).toThrow(new UnauthorizedException('Token has expired'));
    });

    it('should handle authentication errors with string info message', () => {
      const error = new Error('Token invalid');
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
      };
      const info = {
        message: 'Invalid token signature',
      };

      expect(() => {
        guard.handleRequest(error, mockUser, info, mockExecutionContext);
      }).toThrow(new UnauthorizedException('Invalid token signature'));
    });

    it('should handle authentication errors with undefined info', () => {
      const error = new Error('Token invalid');
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
      };

      expect(() => {
        guard.handleRequest(error, mockUser, undefined, mockExecutionContext);
      }).toThrow(new UnauthorizedException('undefined'));
    });

    it('should handle authentication errors with null info message', () => {
      const error = new Error('Token invalid');
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
      };
      const info = {
        message: null,
      };

      expect(() => {
        guard.handleRequest(error, mockUser, info, mockExecutionContext);
      }).toThrow(new UnauthorizedException('null'));
    });

    it('should handle missing user without error', () => {
      // When there's no error but also no user, should still return the user (null)
      const result = guard.handleRequest(null, null, null, mockExecutionContext);

      expect(result).toBe(null);
    });

    it('should handle empty error and return user', () => {
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
        role: 'ADMIN',
      };

      const result = guard.handleRequest(null, mockUser, null, mockExecutionContext);

      expect(result).toBe(mockUser);
    });

    it('should handle error with number info message', () => {
      const error = new Error('Token invalid');
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
      };
      const info = {
        message: 404,
      };

      expect(() => {
        guard.handleRequest(error, mockUser, info, mockExecutionContext);
      }).toThrow(new UnauthorizedException('404'));
    });

    it('should handle error with boolean info message', () => {
      const error = new Error('Token invalid');
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
      };
      const info = {
        message: false,
      };

      expect(() => {
        guard.handleRequest(error, mockUser, info, mockExecutionContext);
      }).toThrow(new UnauthorizedException('false'));
    });
  });

  describe('Integration scenarios', () => {
    it('should handle public route with missing token gracefully', () => {
      // Public route should return true regardless of token presence
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should process authentication flow for protected routes', async () => {
      // Protected route should delegate to AuthGuard
      reflector.getAllAndOverride.mockReturnValue(false);

      const mockSuperCanActivate = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      mockSuperCanActivate.mockResolvedValue(true);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });

    it('should handle class-level and method-level public decorators', () => {
      // Test the reflector is called with both handler and class
      reflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should handle falsy values for public decorator', () => {
      // Test various falsy values
      const falsyValues = [false, 0, '', null, undefined];

      falsyValues.forEach((falsyValue) => {
        jest.clearAllMocks();
        reflector.getAllAndOverride.mockReturnValue(falsyValue);

        const mockSuperCanActivate = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
        mockSuperCanActivate.mockReturnValue(true);

        if (falsyValue === undefined || falsyValue === false || falsyValue === 0 || falsyValue === '' || falsyValue === null) {
          guard.canActivate(mockExecutionContext);
          expect(mockSuperCanActivate).toHaveBeenCalledWith(mockExecutionContext);
        }
      });
    });
  });
});