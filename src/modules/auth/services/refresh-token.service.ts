import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { RefreshToken, RefreshTokenDocument } from "../schemas/refresh-token.schema";
import { DeleteResult, Model, Types } from "mongoose";
import { ICreateRefreshToken, IRefreshToken } from "../interfaces/refresh-token.interface";

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
  ) { }

  async create(createRefreshToken: ICreateRefreshToken): Promise<RefreshTokenDocument> {
    return await this.refreshTokenModel.create(createRefreshToken);
  }

  async findByToken(token: string): Promise<RefreshTokenDocument | null> {
    return await this.refreshTokenModel.findOne({ token }).exec();
  }

  async deletePreviousToken(refreshTokenData: IRefreshToken): Promise<RefreshTokenDocument | null> {
    return await this.refreshTokenModel.findOneAndDelete({
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
    }).exec();
  }
  
  async delete(token: string): Promise<DeleteResult> {
    return await this.refreshTokenModel.deleteOne({ token }).exec();
  }

}