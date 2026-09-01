import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessengerAssignmentType, StoreStatus } from '../types/store.type';
import { StoreVarietyType, StoreVarietyTypeSchema } from './variety.schema';
import {
  StoreDeliveryConfig,
  StoreDeliveryConfigSchema,
} from '../../delivery/schemas/store-delivery.schema';

export type StoreDocument = HydratedDocument<Store>;

@Schema({ _id: false })
export class StoreDay {
  @Prop({ type: Number, required: true, min: 0, max: 6 })
  day: number;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  startHour: string;

  @Prop({ type: String, required: true })
  endHour: string;

  /** When false, the store is closed that day (hours kept for when re-enabled). */
  @Prop({ type: Boolean, required: true, default: true })
  isOpen: boolean;
}

@Schema({ collection: 'stores', timestamps: true })
export class Store {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 150 })
  name: string;

  @Prop({ type: String, required: false, trim: true, maxlength: 150, default: '' })
  slogan?: string;

  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 255 })
  description: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 255 })
  address: string;

  @Prop({ type: [StoreDay], required: true, default: [] })
  week: StoreDay[];

  @Prop({ type: Types.ObjectId, ref: 'Image', required: false })
  logo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Image', required: false })
  cover?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  messengers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];

  /** Reusable custom variety types (flavor, filling, etc.). Visual is product-level. */
  @Prop({ type: [StoreVarietyTypeSchema], default: [] })
  varietyTypes: StoreVarietyType[];

  @Prop({
    type: String,
    required: true,
    enum: Object.values(StoreStatus),
    default: StoreStatus.ACTIVE,
    index: true,
  })
  status: StoreStatus;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(MessengerAssignmentType),
    default: MessengerAssignmentType.AUTOMATIC,
  })
  messengerAssignmentType: MessengerAssignmentType;

  /** Precios de mensajería por zona y recargos por peso influenciador. */
  @Prop({ type: StoreDeliveryConfigSchema, default: () => ({ zonePrices: [], weightSurchargeTiers: [] }) })
  deliveryConfig: StoreDeliveryConfig;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

const centsToDecimal = (cents: number): number => cents / 100;

StoreSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (Array.isArray(obj.varietyTypes)) {
    obj.varietyTypes = obj.varietyTypes.map((type: any) => ({
      ...type,
      options: (type.options || []).map((option: any) => ({
        ...option,
        priceDelta: centsToDecimal(option.priceDelta ?? 0),
      })),
    }));
  }
  if (obj.deliveryConfig) {
    obj.deliveryConfig = {
      ...obj.deliveryConfig,
      zonePrices: (obj.deliveryConfig.zonePrices || []).map((zp: any) => ({
        zoneId: zp.zoneId?.toString?.() || zp.zoneId,
        price: centsToDecimal(zp.priceCents ?? 0),
      })),
      weightSurchargeTiers: (obj.deliveryConfig.weightSurchargeTiers || []).map(
        (tier: any) => ({
          minWeight: tier.minWeight,
          maxWeight: tier.maxWeight,
          surcharge: centsToDecimal(tier.surchargeCents ?? 0),
        }),
      ),
    };
  }
  return obj;
};
