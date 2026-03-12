import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PendingChargeDocument = HydratedDocument<PendingCharge>;

export enum ChargeType {
  DELIVERY_RETURN = 'delivery_return',
  SERVICE_FEE = 'service_fee',
  OTHER = 'other',
}

export enum ChargeStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class PendingCharge {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: [ChargeType.DELIVERY_RETURN, ChargeType.SERVICE_FEE, ChargeType.OTHER],
    default: ChargeType.OTHER
  })
  type: ChargeType;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({
    type: String,
    required: true,
    enum: [ChargeStatus.PENDING, ChargeStatus.PAID, ChargeStatus.CANCELLED],
    default: ChargeStatus.PENDING
  })
  status: ChargeStatus;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: String })
  paymentReference?: string;
}

export const PendingChargeSchema = SchemaFactory.createForClass(PendingCharge);