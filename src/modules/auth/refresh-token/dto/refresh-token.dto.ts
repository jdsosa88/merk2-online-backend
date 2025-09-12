import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Types } from "mongoose";

export class CreateRefreshTokenDTO {
  readonly userId: Types.ObjectId;
  readonly token: string;
  ip?: string;
  userAgent?: string;
  expiresAt: Date;
}