import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({ 
  collection: "refresh_tokens",
  timestamps: true,
})
export class RefreshToken {
  
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @Prop({ required: true, unique: true })
  token: string;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  @IsDate()
  @Prop({ required: true })
  expiresAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);