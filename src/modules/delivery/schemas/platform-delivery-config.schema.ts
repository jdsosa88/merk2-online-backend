import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  WeightSurchargeTier,
  WeightSurchargeTierSchema,
} from './weight-surcharge-tier.schema';

export type PlatformDeliveryConfigDocument =
  HydratedDocument<PlatformDeliveryConfig>;

/** Documento singleton con valores por defecto de recargos por peso influenciador. */
@Schema({ collection: 'platform_delivery_config', timestamps: true })
export class PlatformDeliveryConfig {
  @Prop({ type: String, required: true, unique: true, default: 'default' })
  key: string;

  @Prop({ type: [WeightSurchargeTierSchema], required: true, default: [] })
  weightSurchargeTiers: WeightSurchargeTier[];
}

export const PlatformDeliveryConfigSchema = SchemaFactory.createForClass(
  PlatformDeliveryConfig,
);

PlatformDeliveryConfigSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (Array.isArray(obj.weightSurchargeTiers)) {
    obj.weightSurchargeTiers = obj.weightSurchargeTiers.map((tier: WeightSurchargeTier) => ({
      ...tier,
      surcharge: (tier.surchargeCents ?? 0) / 100,
    }));
  }
  return obj;
};
