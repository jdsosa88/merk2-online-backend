import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  WeightSurchargeTier,
  WeightSurchargeTierSchema,
} from './weight-surcharge-tier.schema';

@Schema({ _id: false })
export class StoreZonePrice {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryZone', required: true })
  zoneId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  priceCents: number;
}

export const StoreZonePriceSchema = SchemaFactory.createForClass(StoreZonePrice);

@Schema({ _id: false })
export class StoreDeliveryConfig {
  /** Precio de mensajería por zona para esta tienda (sobreescribe el default de plataforma). */
  @Prop({ type: [StoreZonePriceSchema], default: [] })
  zonePrices: StoreZonePrice[];

  /**
   * Recargos por rango de peso influenciador.
   * Vacío = usar valores por defecto de plataforma.
   */
  @Prop({ type: [WeightSurchargeTierSchema], default: [] })
  weightSurchargeTiers: WeightSurchargeTier[];
}

export const StoreDeliveryConfigSchema =
  SchemaFactory.createForClass(StoreDeliveryConfig);
