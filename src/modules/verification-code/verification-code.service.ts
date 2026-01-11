import { Injectable } from '@nestjs/common';
import { VerificationCode } from './schemas/verification-code.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class VerificationCodeService {
  constructor(
    @InjectModel(VerificationCode.name)
    private verificationCodeModel: Model<VerificationCode>,
  ) { }

  async createCode(userId: Types.ObjectId, type: string, expiresInHours: number = 2): Promise<VerificationCode> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    return this.verificationCodeModel.create({
      user: userId,
      code,
      type,
      expiresAt,
    });
  }

  async verifyCode(userId: Types.ObjectId, code: string, type: string): Promise<boolean> {
    switch (type) {
      case 'verify_reset_password':
        return await this.verifyResetCode(userId, code);
      case 'reset_password':
        return await this.verifyResetCodeToChangePassword(userId, code);
      case 'activation':
      case 'delete':
        return await this.verifyDefaultCode(userId, code, type);
      default:
        return false;
    }
  }

  private async verifyDefaultCode(userId: Types.ObjectId, code: string, type: string): Promise<boolean> {
    const now = new Date();
    const record = await this.verificationCodeModel.findOneAndDelete({
      user: userId,
      code,
      type,
    }).exec();
    if (!record) return false;
    if (record.expiresAt.getTime() <= now.getTime()) return false;
    return true;
  }

  private async verifyResetCode(userId: Types.ObjectId, code: string): Promise<boolean> {
    const now = new Date();
    const record = await this.verificationCodeModel.findOneAndUpdate(
      {
        user: userId,
        code,
        type: 'reset_password',
      },
      {
        isVerified: true,
      }
    ).exec();
    if (!record) return false;
    if (record.expiresAt.getTime() <= now.getTime()) {
      await this.verificationCodeModel.findByIdAndDelete(record._id).exec();
      return false;
    };
    return true;
  }

  private async verifyResetCodeToChangePassword(userId: Types.ObjectId, code: string): Promise<boolean> {
    const now = new Date();
    const record = await this.verificationCodeModel.findOne(
      {
        user: userId,
        code,
        type: 'reset_password',
      }
    ).exec();
    if (!record) return false;
    if (!record.isVerified) return false;
    await this.verificationCodeModel.findByIdAndDelete(record._id).exec();
    if (record.expiresAt.getTime() <= now.getTime()) {
      return false;
    };
    return true;
  }

}