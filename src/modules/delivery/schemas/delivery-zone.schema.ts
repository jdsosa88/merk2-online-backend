import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryZoneDocument = HydratedDocument<DeliveryZone>;

@Schema({ collection: 'delivery_zones', timestamps: true })
export class DeliveryZone {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 80 })
  province: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 80 })
  municipality: string;

  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 120 })
  name: string;

  /** Precio base de mensajería por defecto (centavos). */
  @Prop({ type: Number, required: true, min: 0 })
  defaultPriceCents: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;
}

export const DeliveryZoneSchema = SchemaFactory.createForClass(DeliveryZone);

DeliveryZoneSchema.index(
  { province: 1, municipality: 1, name: 1 },
  { unique: true },
);

DeliveryZoneSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.defaultPrice = (obj.defaultPriceCents ?? 0) / 100;
  delete obj.defaultPriceCents;
  return obj;
};
