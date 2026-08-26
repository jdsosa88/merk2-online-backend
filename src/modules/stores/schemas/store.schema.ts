import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessengerAssignmentType, StoreStatus } from '../types/store.type';

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
}

export const StoreSchema = SchemaFactory.createForClass(Store);
