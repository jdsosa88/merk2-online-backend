import { Types } from "mongoose";

export interface IRefreshToken {
  readonly userId: Types.ObjectId;
  readonly token: string;
  ip?: string;
  userAgent?: string;
}

export interface ICreateRefreshToken extends IRefreshToken {
  expiresAt: Date;
}