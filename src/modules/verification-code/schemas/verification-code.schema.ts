import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type VerificationCodeDocument = HydratedDocument<VerificationCode>;

export type VerificationType = 'activation' | 'delete' | 'reset_password' ;

@Schema({ 
  collection: "verification_codes",
  timestamps: true,
})
export class VerificationCode {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({
    required: true,
    enum: ['activation', 'delete', 'reset_password' ],
    default: 'activation'
  })
  type: VerificationType;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ 
    required: true,
    default: false,
  })
  isVerified: boolean;
}

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);