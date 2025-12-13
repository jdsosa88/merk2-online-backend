import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Geolocation } from 'src/common/schemas/geolocation.schema';

export type BusinessDocument = HydratedDocument<Business>;

type BusinessStatusType = 'requested' | 'accepted' | 'pending';
export enum BusinessStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  PENDING = 'pending',
}

@Schema({ _id: false })
class Employees {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [Types.ObjectId] })
  managers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [Types.ObjectId] })
  messengers: Types.ObjectId[];
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
  @Prop({ type: String, required: true, length: 150 })
  name: string;

  @Prop({ type: String, required: true, length: 255 })
  description: string;

  @Prop({ type: Geolocation, required: true })
  geolocation: Geolocation;

  //faltan protalPick y pick que son imagenes

  @Prop({ type: [String], required: false, default: [String] })
  phones: string[];

  @Prop({ type: [Day], required: true, default: [Day] })
  week: Day[];

  // faltan aqui categorias y sub-categorias

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner: Types.ObjectId[];

  @Prop({ type: Employees })
  employees: Employees;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [Types.ObjectId] })
  products: Types.ObjectId[];

  @Prop({ 
    required: true,
    enum: [BusinessStatus.REQUESTED, BusinessStatus.ACCEPTED, BusinessStatus.PENDING], 
    default: BusinessStatus.REQUESTED,
  })
  status: BusinessStatusType;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
