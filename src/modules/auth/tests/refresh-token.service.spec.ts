import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RefreshTokenService } from '../services/refresh-token.service';
import { RefreshToken } from '../schemas/refresh-token.schema';
import { Model, Types } from 'mongoose';
import { CreateRefreshTokenDTO } from '../dto/refresh-token.dto';

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

  const mockCreateRefreshTokenDTO: CreateRefreshTokenDTO = {
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
        ...mockCreateRefreshTokenDTO,
        _id: mockObjectId,
      };

      mockModel.create.mockResolvedValue(expectedToken);

      // Act
      const result = await service.create(mockCreateRefreshTokenDTO);

      // Assert
      expect(result).toEqual(expectedToken);
      expect(mockModel.create).toHaveBeenCalledWith(mockCreateRefreshTokenDTO);
    });

    it('should create refresh token without optional fields', async () => {
      // Arrange
      const minimalDto: CreateRefreshTokenDTO = {
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

  describe('findByUser', () => {
    it('should find refresh token by user', async () => {
      // Arrange
      const userId = mockUserId;

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRefreshToken),
      });

      // Act
      const result = await service.findByUser(userId);

      // Assert
      expect(result).toEqual(mockRefreshToken);
      expect(mockModel.findOne).toHaveBeenCalledWith({ user: userId });
    });

    it('should return null when user has no refresh token', async () => {
      // Arrange
      const userId = new Types.ObjectId();

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.findByUser(userId);

      // Assert
      expect(result).toBeNull();
      expect(mockModel.findOne).toHaveBeenCalledWith({ user: userId });
    });
  });

  describe('deletePreviousToken', () => {
    it('should delete previous token successfully with all parameters', async () => {
      // Arrange
      const refreshToken = 'old-refresh-token';
      const userId = mockUserId;
      const ip = '192.168.1.1';
      const userAgent = 'Test Browser';

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRefreshToken),
      });

      // Act
      const result = await service.deletePreviousToken(refreshToken, userId, ip, userAgent);

      // Assert
      expect(result).toEqual(mockRefreshToken);
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        $or: [
          { refreshToken },
          { $and: [{ userId }, { ip }, { userAgent }] }
        ]
      });
    });

    it('should delete previous token with minimal parameters', async () => {
      // Arrange
      const refreshToken = 'old-refresh-token';
      const userId = mockUserId;

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRefreshToken),
      });

      // Act
      const result = await service.deletePreviousToken(refreshToken, userId);

      // Assert
      expect(result).toEqual(mockRefreshToken);
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        $or: [
          { refreshToken },
          { $and: [{ userId }, { ip: undefined }, { userAgent: undefined }] }
        ]
      });
    });

    it('should return null when no previous token found', async () => {
      // Arrange
      const refreshToken = 'non-existent-token';
      const userId = new Types.ObjectId();

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.deletePreviousToken(refreshToken, userId);

      // Assert
      expect(result).toBeNull();
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        $or: [
          { refreshToken },
          { $and: [{ userId }, { ip: undefined }, { userAgent: undefined }] }
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

  describe('deleteById', () => {
    it('should delete token by ID', async () => {
      // Arrange
      const tokenId = mockObjectId;
      const deleteResult = { deletedCount: 1, acknowledged: true };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      // Act
      const result = await service.deleteById(tokenId);

      // Assert
      expect(result).toEqual(deleteResult);
      expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: tokenId });
    });

    it('should handle deletion when ID does not exist', async () => {
      // Arrange
      const tokenId = new Types.ObjectId();
      const deleteResult = { deletedCount: 0, acknowledged: true };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      // Act
      const result = await service.deleteById(tokenId);

      // Assert
      expect(result).toEqual(deleteResult);
      expect(result.deletedCount).toBe(0);
      expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: tokenId });
    });
  });

  describe('deleteAllForUser', () => {
    it('should delete all tokens for user', async () => {
      // Arrange
      const userId = mockUserId;
      const deleteResult = { deletedCount: 3, acknowledged: true };

      mockModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      // Act
      const result = await service.deleteAllForUser(userId);

      // Assert
      expect(result).toEqual(deleteResult);
      expect(mockModel.deleteMany).toHaveBeenCalledWith({ user: userId });
    });

    it('should handle deletion when user has no tokens', async () => {
      // Arrange
      const userId = new Types.ObjectId();
      const deleteResult = { deletedCount: 0, acknowledged: true };

      mockModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      // Act
      const result = await service.deleteAllForUser(userId);

      // Assert
      expect(result).toEqual(deleteResult);
      expect(result.deletedCount).toBe(0);
      expect(mockModel.deleteMany).toHaveBeenCalledWith({ user: userId });
    });

    it('should delete multiple tokens for user', async () => {
      // Arrange
      const userId = mockUserId;
      const deleteResult = { deletedCount: 5, acknowledged: true };

      mockModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      // Act
      const result = await service.deleteAllForUser(userId);

      // Assert
      expect(result).toEqual(deleteResult);
      expect(result.deletedCount).toBe(5);
      expect(mockModel.deleteMany).toHaveBeenCalledWith({ user: userId });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle token lifecycle operations', async () => {
      // Test a complete workflow: create -> find -> delete
      const token = 'lifecycle-test-token';
      const userId = mockUserId;

      // Create token
      const createDto: CreateRefreshTokenDTO = {
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

    it('should handle multiple tokens for same user', async () => {
      // Test scenario where user has multiple refresh tokens
      const userId = mockUserId;
      const tokens = ['token1', 'token2', 'token3'];

      // Create multiple tokens
      for (const token of tokens) {
        const createDto: CreateRefreshTokenDTO = {
          userId,
          token,
          expiresAt: new Date(),
        };

        mockModel.create.mockResolvedValue({ ...createDto, _id: new Types.ObjectId() });
        await service.create(createDto);
      }

      // Delete all tokens for user
      const deleteResult = { deletedCount: tokens.length, acknowledged: true };
      mockModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deleteResult),
      });

      const result = await service.deleteAllForUser(userId);
      expect(result.deletedCount).toBe(tokens.length);
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

        const result = await service.deletePreviousToken(
          scenario.refreshToken,
          scenario.userId,
          scenario.ip,
          scenario.userAgent
        );

        expect(result).toEqual(mockRefreshToken);
      }
    });
  });
});