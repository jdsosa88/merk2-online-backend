import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: true })
export class ProductVisualOption {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 1, maxlength: 100 })
  label: string;

  /** Extra amount in cents added to the product base finalPrice. */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  priceDelta: number;

  @Prop({ type: Types.ObjectId, ref: 'Image', required: false })
  image?: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;
}

export const ProductVisualOptionSchema = SchemaFactory.createForClass(ProductVisualOption);
