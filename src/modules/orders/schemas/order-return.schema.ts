import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: false, timestamps: false })
export class OrderReturnItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: String, required: false })
  productName?: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  /** Snapshot unit price in cents at return time. */
  @Prop({ type: Number, required: true, min: 0 })
  pricePerUnit: number;
}

export const OrderReturnItemSchema = SchemaFactory.createForClass(OrderReturnItem);

@Schema({ timestamps: true })
export class OrderReturn {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: [OrderReturnItemSchema], required: true, default: [] })
  items: OrderReturnItem[];

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  reason: string;

  @Prop({ type: String, required: false, trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Image', required: false })
  evidenceImage?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  /** Client-generated id for offline sync idempotency. */
  @Prop({ type: String, required: false, index: true, sparse: true })
  clientLocalId?: string;
}

export const OrderReturnSchema = SchemaFactory.createForClass(OrderReturn);
