import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessengerInDeliveryDocument = HydratedDocument<MessengerInDelivery>;


@Schema({
  collection: "messengers_in_delivery",
  timestamps: true
})
export class MessengerInDelivery {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  messenger: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Order' }], default: [] })
  orders: Types.ObjectId[];
}

export const MessengerInDeliverySchema = SchemaFactory.createForClass(MessengerInDelivery);