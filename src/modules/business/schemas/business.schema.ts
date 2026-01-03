import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Geolocation } from 'src/common/schemas/geolocation.schema';
import { Image } from 'src/common/schemas/image.schema';
import { BusinessStatus, BusinessStatusType } from '../types/business.type';

export type BusinessDocument = HydratedDocument<Business>;

@Schema({ _id: false })
class Employees {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [Types.ObjectId] })
  managers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [Types.ObjectId] })
  messengers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'EmploymentRequest' }], default: [] })
  pendingEmployees: Types.ObjectId[];
}

@Schema({ _id: false })
class Day {
  day: number;
  name: string;
  startHour: string; //momentaneamente string pero es un time formato 24 horas
  endHour: string; //momentaneamente string pero es un time formato 24 horas
}

@Schema({ timestamps: true })
export class Business {
  @Prop({ type: String, required: true, length: 150, unique: true })
  name: string;

  @Prop({ type: String, required: true, length: 255 })
  description: string;

  @Prop({ type: Geolocation, required: false })
  geolocation?: Geolocation;

  @Prop({ type: Image, required: false })
  pic?: Image;

  @Prop({ type: Image, required: false })
  portalPic?: Image;

  @Prop({ type: [String], required: false, default: [String] })
  phones: string[];

  @Prop({ type: [Day], required: true, default: [Day] })
  week: Day[];

  // faltan aqui categorias y sub-categorias

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ type: Employees })
  employees: Employees;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];

  @Prop({
    required: true,
    enum: [
      BusinessStatus.REQUESTED,
      BusinessStatus.ACCEPTED,
      BusinessStatus.PENDING,
      BusinessStatus.DISABLED
    ],
    default: BusinessStatus.REQUESTED,
  })
  status: BusinessStatusType;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
