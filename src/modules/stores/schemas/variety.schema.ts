import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: true })
export class StoreVarietyOption {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 1, maxlength: 100 })
  label: string;

  /** Extra amount in cents added to the product base finalPrice. */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  priceDelta: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  /** When true, pre-selected on product detail as part of the base order. One per variety type. */
  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;
}

export const StoreVarietyOptionSchema = SchemaFactory.createForClass(StoreVarietyOption);

@Schema({ _id: true })
export class StoreVarietyType {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 1, maxlength: 100 })
  name: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: true })
  isRequired: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: [StoreVarietyOptionSchema], default: [] })
  options: StoreVarietyOption[];
}

export const StoreVarietyTypeSchema = SchemaFactory.createForClass(StoreVarietyType);
