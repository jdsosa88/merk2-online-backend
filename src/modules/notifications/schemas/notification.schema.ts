import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationType } from '../types/notification.type';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(NotificationType),
    index: true,
  })
  type: NotificationType;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  body: string;

  /** Extra payload for navigation / detail screens (orderId, content, etc.). */
  @Prop({ type: Object, default: {} })
  data: Record<string, unknown>;

  @Prop({ type: Date, required: false })
  readAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: false, index: true })
  relatedOrder?: Types.ObjectId;

  /** Keep past day boundary when linked to a future reservation order. */
  @Prop({ type: Boolean, required: true, default: false, index: true })
  isReservationRelated: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ isReservationRelated: 1, createdAt: 1 });
