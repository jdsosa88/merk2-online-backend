import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { RefreshToken } from "../schemas/refresh-token.schema";
import { DeleteResult, Model, Types } from "mongoose";
import { CreateRefreshTokenDTO } from "../dto/refresh-token.dto";

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
  ) { }

  async create(refreshTokenDto: CreateRefreshTokenDTO): Promise<RefreshToken> {
    return await this.refreshTokenModel.create(refreshTokenDto);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.refreshTokenModel.findOne({ token }).exec();
  }

  async findByUser(userId: Types.ObjectId): Promise<RefreshToken | null> {
    return await this.refreshTokenModel.findOne({ user: userId }).exec();
  }

  async deletePreviousToken(
    refreshToken: string,
    userId: Types.ObjectId,
    ip?: string,
    userAgent?: string
  ): Promise<RefreshToken | null> {
    return await this.refreshTokenModel.findOneAndDelete({
      $or: [
        { refreshToken },
        { $and: [{ userId }, { ip }, { userAgent }] }
      ]
    }).exec();
  }

  async delete(token: string) {
    return await this.refreshTokenModel.deleteOne({ token }).exec();
  }

  async deleteById(id: Types.ObjectId): Promise<DeleteResult> {
    return await this.refreshTokenModel.deleteOne({ _id: id }).exec();
  }

  async deleteAllForUser(userId: Types.ObjectId): Promise<DeleteResult> {
    return await this.refreshTokenModel.deleteMany({ user: userId }).exec();
  }
}