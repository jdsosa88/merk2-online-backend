import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type verificationType = 'activation' | 'delete' | 'reset_password' ;
@Schema({ 
  collection: "verification_codes",
  timestamps: true,
})
export class VerificationCode extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({
    required: true,
    enum: ['activation', 'delete', 'reset_password' ],
    default: 'activation'
  })
  type: verificationType;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ 
    required: true,
    default: false,
  })
  isVerified: boolean;
}

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);