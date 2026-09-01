import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Rango de peso influenciador acumulado del pedido → recargo sobre el precio base de zona. */
@Schema({ _id: false })
export class WeightSurchargeTier {
  @Prop({ type: Number, required: true, min: 0 })
  minWeight: number;

  @Prop({ type: Number, required: true, min: 0 })
  maxWeight: number;

  /** Recargo en centavos (0 = solo precio base de zona). */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  surchargeCents: number;
}

export const WeightSurchargeTierSchema =
  SchemaFactory.createForClass(WeightSurchargeTier);
