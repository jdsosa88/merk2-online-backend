import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderChannel, OrderStatus } from '../types/orders.type';
import { Geolocation } from 'src/common/schemas/geolocation.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false, timestamps: false })
export class SelectedVarietyOption {
  @Prop({ type: String, required: true })
  varietyTypeId: string;

  @Prop({ type: String, required: true })
  varietyTypeLabel: string;

  @Prop({ type: String, required: true })
  optionId: string;

  @Prop({ type: String, required: true })
  optionLabel: string;

  /** Snapshot in cents at checkout time. */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  priceDelta: number;
}

export const SelectedVarietyOptionSchema =
  SchemaFactory.createForClass(SelectedVarietyOption);

@Schema({ _id: false, timestamps: false })
export class SelectedOrderAddon {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  addonId: Types.ObjectId;

  @Prop({ type: String, required: true })
  addonLabel: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  /** Addon unit price in cents at checkout (for extras beyond base). */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  pricePerUnit: number;

  /** Extra charged for this addon line: (quantity - 1) * pricePerUnit in cents. */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  totalPrice: number;
}

export const SelectedOrderAddonSchema =
  SchemaFactory.createForClass(SelectedOrderAddon);

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

  /** Empty = baker's choice / no customization. */
  @Prop({ type: [SelectedVarietyOptionSchema], default: [] })
  selectedOptions: SelectedVarietyOption[];

  /** Plate composition addons with quantities (base qty = 1 each). */
  @Prop({ type: [SelectedOrderAddonSchema], default: [] })
  selectedAddons: SelectedOrderAddon[];
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
  /** Online customer. Optional for in-store POS walk-ins without an account. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  customer?: Types.ObjectId;

  /** Seller (PROVIDER/MANAGER) who registered an in-store sale. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  soldBy?: Types.ObjectId;

  /** Optional label for walk-in / phone customer (POS). */
  @Prop({ type: String, required: false, trim: true, maxlength: 120 })
  walkInCustomerName?: string;

  /** Phone for walk-in / phone orders (POS with delivery). */
  @Prop({ type: String, required: false, trim: true, maxlength: 30 })
  walkInCustomerPhone?: string;

  /** Delivery zone selected for POS phone orders with messaging. */
  @Prop({ type: Types.ObjectId, ref: 'DeliveryZone', required: false })
  deliveryZone?: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: [OrderChannel.ONLINE, OrderChannel.IN_STORE],
    default: OrderChannel.ONLINE,
  })
  channel: OrderChannel;

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

  /** Required for online delivery orders; omitted for in-store POS. */
  @Prop({ type: Geolocation, required: false })
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

const centsToDecimal = function (cents: number): number {
  return cents / 100;
};

OrderSchema.methods.toJSON = function () {
  const obj = this.toObject();

  obj.subtotal = centsToDecimal(obj.subtotal);
  obj.deliveryCharge = centsToDecimal(obj.deliveryCharge);
  obj.total = centsToDecimal(obj.total);

  if (obj.items) {
    obj.items = obj.items.map((item: any) => ({
      ...item,
      pricePerUnit: centsToDecimal(item.pricePerUnit),
      totalPrice: centsToDecimal(item.totalPrice),
      selectedOptions: (item.selectedOptions || []).map((option: any) => ({
        ...option,
        priceDelta: centsToDecimal(option.priceDelta ?? 0),
      })),
      selectedAddons: (item.selectedAddons || []).map((addon: any) => ({
        ...addon,
        pricePerUnit: centsToDecimal(addon.pricePerUnit ?? 0),
        totalPrice: centsToDecimal(addon.totalPrice ?? 0),
      })),
    }));
  }

  if (obj.additionalCharges) {
    obj.additionalCharges = obj.additionalCharges.map((charge: any) => ({
      ...charge,
      amount: centsToDecimal(charge.amount),
    }));
  }

  return obj;
};

OrderSchema.statics.decimalToCents = function (decimal: number): number {
  return Math.round(decimal * 100);
};

OrderSchema.statics.centsToDecimal = function (cents: number): number {
  return cents / 100;
};
