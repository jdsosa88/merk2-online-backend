import { IsObjectIdPipe, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Document, Types } from 'mongoose';

@Schema({ 
  collection: "refresh_tokens",
  timestamps: true,
})
export class RefreshToken extends Document {
  
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