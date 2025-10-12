import { Test, TestingModule } from '@nestjs/testing';
import { VerificationCodeService } from './verification-code.service';
import { getModelToken } from '@nestjs/mongoose';
import { VerificationCode } from './schemas/verification-code.schema';
import { Model, Types } from 'mongoose';

describe('VerificationCodeService', () => {
  let service: VerificationCodeService;
  let model: Model<VerificationCode>;

  const mockObjectId = new Types.ObjectId();

  const mockVerificationCode = {
    _id: mockObjectId,
    user: mockObjectId,
    code: '123456',
    type: 'activation',
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    isVerified: false,
  };

  const mockModel = {
    create: jest.fn(),
    findOneAndDelete: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationCodeService,
        {
          provide: getModelToken(VerificationCode.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<VerificationCodeService>(VerificationCodeService);
    model = module.get<Model<VerificationCode>>(getModelToken(VerificationCode.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCode', () => {
    it('should create verification code successfully', async () => {
      // Arrange
      const userId = mockObjectId;
      const type = 'activation';
      const expiresInHours = 2;
      const expectedCode = {
        ...mockVerificationCode,
        user: userId,
        type,
      };

      mockModel.create.mockResolvedValue(expectedCode);

      // Mock Math.random to get predictable code
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.123456);

      // Act
      const result = await service.createCode(userId, type, expiresInHours);

      // Assert
      expect(result).toEqual(expectedCode);
      expect(mockModel.create).toHaveBeenCalledWith({
        user: userId,
        code: expect.any(String),
        type,
        expiresAt: expect.any(Date),
      });

      const createCall = mockModel.create.mock.calls[0][0];
      expect(createCall.code).toMatch(/^\d{6}$/); // 6-digit code
      expect(createCall.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Restore Math.random
      Math.random = originalRandom;
    });
  });

  describe('verifyCode', () => {
    it('should verify activation code successfully', async () => {
      // Arrange
      const userId = mockObjectId;
      const code = '123456';
      const type = 'activation';

      const validRecord = {
        ...mockVerificationCode,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      };

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(validRecord),
      });

      // Act
      const result = await service.verifyCode(userId, code, type);

      // Assert
      expect(result).toBe(true);
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        user: userId,
        code,
        type: 'activation',
      });
    });

    it('should verify reset code successfully', async () => {
      // Arrange
      const userId = mockObjectId;
      const code = '123456';
      const type = 'verify_reset_password';

      const validRecord = {
        ...mockVerificationCode,
        type: 'reset_password',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      };

      mockModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(validRecord),
      });

      // Act
      const result = await service.verifyCode(userId, code, type);

      // Assert
      expect(result).toBe(true);
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          user: userId,
          code,
          type: 'reset_password',
        },
        {
          isVerified: true,
        }
      );
    });

    it('should verify reset code for password change', async () => {
      // Arrange
      const userId = mockObjectId;
      const code = '123456';
      const type = 'reset_password';

      const validRecord = {
        ...mockVerificationCode,
        _id: mockObjectId,
        type: 'reset_password',
        isVerified: true,
      };

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(validRecord),
      });
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(validRecord),
      });

      // Act
      const result = await service.verifyCode(userId, code, type);

      // Assert
      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        user: userId,
        code,
        type: 'reset_password',
      });
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(validRecord._id);
    });

    it('should return false for invalid verification type', async () => {
      // Arrange
      const userId = mockObjectId;
      const code = '123456';
      const type = 'invalid_type';

      // Act
      const result = await service.verifyCode(userId, code, type);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('verifyActivationCode', () => {
    it('should return false when code is expired', async () => {
      // Arrange
      const userId = mockObjectId;
      const code = '123456';

      const expiredRecord = {
        ...mockVerificationCode,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expiredRecord),
      });

      // Act
      const result = await service.verifyCode(userId, code, 'activation');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when code does not exist', async () => {
      // Arrange
      const userId = mockObjectId;
      const code = '123456';

      mockModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.verifyCode(userId, code, 'activation');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('verifyResetCode', () => {
    it('should delete expired reset code and return false', async () => {
      // Arrange
      const userId = mockObjectId;
      const code = '123456';

      const expiredRecord = {
        ...mockVerificationCode,
        _id: mockObjectId,
        type: 'reset_password',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };

      mockModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expiredRecord),
      });
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expiredRecord),
      });

      // Act
      const result = await service.verifyCode(userId, code, 'verify_reset_password');

      // Assert
      expect(result).toBe(false);
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(expiredRecord._id);
    });
  });

  describe('verifyResetCodeToChangePassword', () => {
    it('should return false when reset code is not verified', async () => {
      // Arrange
      const userId = mockObjectId;
      const code = '123456';

      const unverifiedRecord = {
        ...mockVerificationCode,
        type: 'reset_password',
        isVerified: false,
      };

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(unverifiedRecord),
      });

      // Act
      const result = await service.verifyCode(userId, code, 'reset_password');

      // Assert
      expect(result).toBe(false);
    });
  });
});