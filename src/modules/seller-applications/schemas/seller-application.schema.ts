import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SellerApplicationStatus } from '../types/seller-application.type';

export type SellerApplicationDocument = HydratedDocument<SellerApplication>;

@Schema({ collection: 'seller_applications', timestamps: true })
export class SellerApplication {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 150 })
  fullName: string;

  @Prop({ type: String, required: true, trim: true })
  email: string;

  @Prop({ type: String, required: true, trim: true })
  phone: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 50 })
  ci: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 255 })
  address: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 255 })
  license: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(SellerApplicationStatus),
    default: SellerApplicationStatus.PENDING,
    index: true,
  })
  status: SellerApplicationStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  reviewedAt?: Date;

  @Prop({ type: String, required: false, maxlength: 500 })
  rejectionReason?: string;
}

export const SellerApplicationSchema = SchemaFactory.createForClass(SellerApplication);
SellerApplicationSchema.index({ user: 1, status: 1 });
