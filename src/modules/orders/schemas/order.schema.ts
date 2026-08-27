import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderStatus } from '../types/orders.type';
import { Geolocation } from 'src/common/schemas/geolocation.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false, timestamps: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true, min: 0 })
  pricePerUnit: number; 

  @Prop({ type: Number, required: true, min: 0 })
  totalPrice: number; 

  @Prop({ type: String, required: false })
  productName?: string;

  @Prop({ type: String, required: false })
  productSku?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false, timestamps: false })
export class AdditionalCharge {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number; 

  @Prop({ type: String, required: false })
  description?: string;
}

export const AdditionalChargeSchema = SchemaFactory.createForClass(AdditionalCharge);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true, default: [] })
  items: OrderItem[];

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  subtotal: number; 

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  deliveryCharge: number; 

  @Prop({ type: [AdditionalChargeSchema], default: [] })
  additionalCharges: AdditionalCharge[];

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  total: number; 

  @Prop({
    type: String,
    required: true,
    enum: [
      OrderStatus.REQUESTED,
      OrderStatus.CANCELLED,
      OrderStatus.IN_PREPARATION,
      OrderStatus.REJECTED,
      OrderStatus.READY_FOR_DELIVERY,
      OrderStatus.ON_THE_WAY,
      OrderStatus.ABORTED,
      OrderStatus.COMPLETED,
      OrderStatus.RETURNED,
    ],
    default: OrderStatus.REQUESTED,
  })
  status: OrderStatus;

  @Prop({ type: String, required: false })
  cancellationReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  assignedMessenger?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  estimatedDeliveryTime?: Date;

  @Prop({ type: Date, required: false })
  scheduledFor?: Date;

  @Prop({ type: Geolocation, required: true })
  deliveryAddress?: Geolocation;

  @Prop({ type: Boolean, default: false })
  hasPendingCharges: boolean;

  @Prop({ type: String, required: false })
  notes?: string;

  @Prop({ type: Date })
  statusUpdatedAt: Date;

  @Prop({ type: String, required: false })
  trackingNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  updatedBy?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
const centsToDecimal = function(cents: number): number {
  return cents / 100;
};
// Helper methods para convertir
OrderSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Convertir centavos a decimales para la respuesta
  obj.subtotal = centsToDecimal(obj.subtotal);
  obj.deliveryCharge = centsToDecimal(obj.deliveryCharge);
  obj.total = centsToDecimal(obj.total);
  
  // Convertir items
  if (obj.items) {
    obj.items = obj.items.map((item: any) => ({
      ...item,
      pricePerUnit: centsToDecimal(item.pricePerUnit),
      totalPrice: centsToDecimal(item.totalPrice)
    }));
  }  
  
  if (obj.additionalCharges) {
    obj.additionalCharges = obj.additionalCharges.map((charge: any) => ({
      ...charge,
      amount: centsToDecimal(charge.amount)
    }));
  }
  
  return obj;
};

OrderSchema.statics.decimalToCents = function(decimal: number): number {
  return Math.round(decimal * 100);
};

OrderSchema.statics.centsToDecimal = function(cents: number): number {
  return cents / 100;
};