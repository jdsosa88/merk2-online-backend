import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  const createMockExecutionContext = (headers: any = {}): ExecutionContext => ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers,
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow valid API key', () => {
      // Arrange
      const validApiKey = 'valid-api-key-123';
      const mockContext = createMockExecutionContext({
        'x-api-key': validApiKey,
      });

      configService.get.mockReturnValue(validApiKey);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should reject missing API key', () => {
      // Arrange
      const validApiKey = 'valid-api-key-123';
      const mockContext = createMockExecutionContext({});

      configService.get.mockReturnValue(validApiKey);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should reject invalid API key', () => {
      // Arrange
      const validApiKey = 'valid-api-key-123';
      const invalidApiKey = 'invalid-api-key-456';
      const mockContext = createMockExecutionContext({
        'x-api-key': invalidApiKey,
      });

      configService.get.mockReturnValue(validApiKey);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle empty header value', () => {
      // Arrange
      const validApiKey = 'valid-api-key-123';
      const mockContext = createMockExecutionContext({
        'x-api-key': '',
      });

      configService.get.mockReturnValue(validApiKey);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle null API key config', () => {
      // Arrange
      const apiKey = 'some-api-key';
      const mockContext = createMockExecutionContext({
        'x-api-key': apiKey,
      });

      configService.get.mockReturnValue(null);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle empty API key config', () => {
      // Arrange
      const apiKey = 'some-api-key';
      const mockContext = createMockExecutionContext({
        'x-api-key': apiKey,
      });

      configService.get.mockReturnValue('');

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle case sensitive key comparison', () => {
      // Arrange
      const validApiKey = 'Valid-Api-Key-123';
      const wrongCaseApiKey = 'valid-api-key-123';
      const mockContext = createMockExecutionContext({
        'x-api-key': wrongCaseApiKey,
      });

      configService.get.mockReturnValue(validApiKey);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle different header key formats', () => {
      // Test cases with different header variations that should be rejected
      const testCases = [
        { headerKey: 'X-Api-Key', description: 'different case header key' },
        { headerKey: 'x-apikey', description: 'missing dash in header key' },
        { headerKey: 'api-key', description: 'missing x prefix' },
        { headerKey: 'x-api-keys', description: 'plural header key' },
      ];

      testCases.forEach(({ headerKey, description }) => {
        // Arrange
        const validApiKey = 'valid-api-key-123';
        const headers = { [headerKey]: validApiKey };
        const mockContext = createMockExecutionContext(headers);

        configService.get.mockReturnValue(validApiKey);

        // Act & Assert
        expect(() => guard.canActivate(mockContext)).toThrow(
          new UnauthorizedException('Invalid or missing API key')
        );
        expect(configService.get).toHaveBeenCalledWith('API_KEY');

        // Clear mocks for next iteration
        jest.clearAllMocks();
      });
    });

    it('should handle undefined header value', () => {
      // Arrange
      const validApiKey = 'valid-api-key-123';
      const mockContext = createMockExecutionContext({
        'x-api-key': undefined,
      });

      configService.get.mockReturnValue(validApiKey);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle null header value', () => {
      // Arrange
      const validApiKey = 'valid-api-key-123';
      const mockContext = createMockExecutionContext({
        'x-api-key': null,
      });

      configService.get.mockReturnValue(validApiKey);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle whitespace-only header value', () => {
      // Arrange
      const validApiKey = 'valid-api-key-123';
      const mockContext = createMockExecutionContext({
        'x-api-key': '   ',
      });

      configService.get.mockReturnValue(validApiKey);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Invalid or missing API key')
      );
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle exact match with whitespace in valid key', () => {
      // Arrange
      const validApiKey = 'valid api key 123';
      const mockContext = createMockExecutionContext({
        'x-api-key': validApiKey,
      });

      configService.get.mockReturnValue(validApiKey);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle special characters in API key', () => {
      // Arrange
      const validApiKey = 'valid-api-key-123!@#$%^&*()';
      const mockContext = createMockExecutionContext({
        'x-api-key': validApiKey,
      });

      configService.get.mockReturnValue(validApiKey);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle very long API key', () => {
      // Arrange
      const validApiKey = 'a'.repeat(1000);
      const mockContext = createMockExecutionContext({
        'x-api-key': validApiKey,
      });

      configService.get.mockReturnValue(validApiKey);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });
  });

  describe('Integration scenarios', () => {
    it('should properly extract request from execution context', () => {
      // Arrange
      const validApiKey = 'integration-test-key';
      const mockRequest = {
        headers: {
          'x-api-key': validApiKey,
          'user-agent': 'test-agent',
          'content-type': 'application/json',
        },
      };

      const mockHttp = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue(mockHttp),
      } as any;

      configService.get.mockReturnValue(validApiKey);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(mockContext.switchToHttp).toHaveBeenCalled();
      expect(mockHttp.getRequest).toHaveBeenCalled();
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
    });

    it('should handle request with no headers object', () => {
      // Arrange
      const validApiKey = 'test-key';
      const mockRequest = {}; // No headers property

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      configService.get.mockReturnValue(validApiKey);

      // Act & Assert
      // The guard throws a TypeError when trying to access headers['x-api-key'] on undefined
      expect(() => guard.canActivate(mockContext)).toThrow(
        "Cannot read properties of undefined (reading 'x-api-key')"
      );
    });
  });
});