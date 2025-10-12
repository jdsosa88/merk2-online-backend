import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshToken } from './schemas/refresh-token.schema';
import { Model, Types } from 'mongoose';
import { ICreateRefreshToken, IRefreshToken } from './interfaces/refresh-token.interface';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let model: Model<RefreshToken>;

  const mockObjectId = new Types.ObjectId();
  const mockUserId = new Types.ObjectId();

  const mockRefreshToken = {
    _id: mockObjectId,
    userId: mockUserId,
    token: 'mock-refresh-token-123',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Test Browser',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  };

  const mockICreateRefreshToken: ICreateRefreshToken = {
    userId: mockUserId,
    token: 'new-refresh-token-456',
    ip: '192.168.1.2',
    userAgent: 'Chrome/98.0 Test',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  const mockModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    model = module.get<Model<RefreshToken>>(getModelToken(RefreshToken.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create refresh token successfully', async () => {
      // Arrange
      const expectedToken = {
        ...mockICreateRefreshToken,
        _id: mockObjectId,
      };

      mockModel.create.mockResolvedValue(expectedToken);

      // Act
      const result = await service.create(mockICreateRefreshToken);

      // Assert
      expect(result).toEqual(expectedToken);
      expect(mockModel.create).toHaveBeenCalledWith(mockICreateRefreshToken);
    });

    it('should create refresh token without optional fields', async () => {
      // Arrange
      const minimalDto: ICreateRefreshToken = {
        userId: mockUserId,
        token: 'minimal-token',
        expiresAt: new Date(),
      };

      const expectedToken = {
        ...minimalDto,
        _id: mockObjectId,
      };

      mockModel.create.mockResolvedValue(expectedToken);

      // Act
      const result = await service.create(minimalDto);

      // Assert
      expect(result).toEqual(expectedToken);
      expect(mockModel.create).toHaveBeenCalledWith(minimalDto);
    });
  });

  describe('findByToken', () => {
    it('should find refresh token by token', async () => {
      // Arrange
      const token = 'test-token-123';

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRefreshToken),
      });

      // Act
      const result = await service.findByToken(token);

      // Assert
      expect(result).toEqual(mockRefreshToken);
      expect(mockModel.findOne).toHaveBeenCalledWith({ token });
    });

    it('should return null when token not found', async () => {
      // Arrange
      const token = 'non-existent-token';

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.findByToken(token);

      // Assert
      expect(result).toBeNull();
      expect(mockModel.findOne).toHaveBeenCalledWith({ token });
    });
  });

  describe('deletePreviousToken', () => {
    it('should delete previous token successfully with all parameters', async () => {
      // Arrange
      const refreshTokenData: IRefreshToken = {
        userId: mockUserId,
        token: 'old-refresh-token',
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
      }

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRefreshToken),
      });

      // Act
      const result = await service.deletePreviousToken(refreshTokenData);

      // Assert
      expect(result).toEqual(mockRefreshToken);
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        $or: [
          { refreshToken: refreshTokenData.token },
          {
            $and: [
              { userId: refreshTokenData.userId },
              { ip: refreshTokenData.ip },
              { userAgent: refreshTokenData.userAgent }
            ]
          }
        ]
      });
    });

    it('should delete previous token with minimal parameters', async () => {
      // Arrange
      const refreshTokenData: IRefreshToken = {
        userId: mockUserId,
        token: 'old-refresh-token',
      }

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRefreshToken),
      });

      // Act
      const result = await service.deletePreviousToken(refreshTokenData);

      // Assert
      expect(result).toEqual(mockRefreshToken);
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        $or: [
          { refreshToken: refreshTokenData.token },
          {
            $and: [
              { userId: refreshTokenData.userId },
              { ip: undefined },
              { userAgent: undefined }
            ]
          }
        ]
      });
    });

    it('should return null when no previous token found', async () => {
      // Arrange
      const refreshTokenData: IRefreshToken = {
        userId: new Types.ObjectId(),
        token: 'non-existent-token',
      }

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.deletePreviousToken(refreshTokenData);

      // Assert
      expect(result).toBeNull();
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        $or: [
          { refreshToken: refreshTokenData.token },
          {
            $and: [
              { userId: refreshTokenData.userId },
              { ip: undefined },
              { userAgent: undefined }
            ]
          }
        ]
      });
    });
  });

  describe('delete', () => {
    it('should delete token by token string', async () => {
      // Arrange
      const token = 'token-to-delete';
      const deleteResult = { deletedCount: 1, acknowledged: true };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      // Act
      const result = await service.delete(token);

      // Assert
      expect(result).toEqual(deleteResult);
      expect(mockModel.deleteOne).toHaveBeenCalledWith({ token });
    });

    it('should handle deletion when token does not exist', async () => {
      // Arrange
      const token = 'non-existent-token';
      const deleteResult = { deletedCount: 0, acknowledged: true };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      // Act
      const result = await service.delete(token);

      // Assert
      expect(result).toEqual(deleteResult);
      expect(result.deletedCount).toBe(0);
      expect(mockModel.deleteOne).toHaveBeenCalledWith({ token });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle token lifecycle operations', async () => {
      // Test a complete workflow: create -> find -> delete
      const token = 'lifecycle-test-token';
      const userId = mockUserId;

      // Create token
      const createDto: ICreateRefreshToken = {
        userId,
        token,
        expiresAt: new Date(),
      };

      mockModel.create.mockResolvedValue({ ...createDto, _id: mockObjectId });

      const createdToken = await service.create(createDto);
      expect(createdToken.token).toBe(token);

      // Find token
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(createdToken),
      });

      const foundToken = await service.findByToken(token);
      expect(foundToken).toEqual(createdToken);

      // Delete token
      const deleteResult = { deletedCount: 1, acknowledged: true };
      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      const result = await service.delete(token);
      expect(result.deletedCount).toBe(1);
    });

    it('should handle complex deletion scenarios', async () => {
      // Test deletePreviousToken with various combinations
      const refreshToken = 'complex-token';
      const userId = mockUserId;
      const ip = '10.0.0.1';
      const userAgent = 'Complex Browser';

      const scenarios = [
        { refreshToken, userId },
        { refreshToken, userId, ip },
        { refreshToken, userId, ip, userAgent },
        { refreshToken, userId, userAgent },
      ];

      for (const scenario of scenarios) {
        mockModel.findOneAndDelete.mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRefreshToken),
        });
        const refreshTokenData: IRefreshToken = {
          token: scenario.refreshToken,
          userId: scenario.userId,
          ip: scenario.ip,
          userAgent: scenario.userAgent
        }
        const result = await service.deletePreviousToken(refreshTokenData);

        expect(result).toEqual(mockRefreshToken);
      }
    });
  });
});