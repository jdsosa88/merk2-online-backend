import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { RefreshToken } from "./schemas/refresh-token.schema";
import { DeleteResult, Model } from "mongoose";
import { ICreateRefreshToken, IRefreshToken } from "./types/refresh-token.interface";

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
  ) { }

  async create(createRefreshToken: ICreateRefreshToken): Promise<RefreshToken> {
    return await this.refreshTokenModel.create(createRefreshToken);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.refreshTokenModel.findOne({ token }).exec();
  }

  async deletePreviousToken(refreshTokenData: IRefreshToken): Promise<RefreshToken | null> {
    const filters: Record<string, unknown>[] = [];
    if (refreshTokenData.token) {
      filters.push({ token: refreshTokenData.token });
    }
    // Only collapse the same device session when both signals are present.
    // Mongoose drops `undefined` fields; `{ userId }` alone would wipe every session.
    if (refreshTokenData.userId && refreshTokenData.ip && refreshTokenData.userAgent) {
      filters.push({
        userId: refreshTokenData.userId,
        ip: refreshTokenData.ip,
        userAgent: refreshTokenData.userAgent,
      });
    }
    if (!filters.length) return null;
    return this.refreshTokenModel.findOneAndDelete({ $or: filters }).exec();
  }
  
  async delete(token: string): Promise<DeleteResult> {
    return await this.refreshTokenModel.deleteOne({ token }).exec();
  }

}