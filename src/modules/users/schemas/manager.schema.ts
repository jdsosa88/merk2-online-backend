import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from 'mongoose';
import { User } from "./user.schema";

export type ManagerDocument = HydratedDocument<User>;

@Schema()
export class Manager extends User {
  @Prop({ required: true, default: false })
  isMessenger: boolean;

    @Prop({
      type: Types.ObjectId,
      ref: 'Business',
      required: false,
      default: null,
    })  
    business: Types.ObjectId | null;
}

export const ManagerSchema = SchemaFactory.createForClass(Manager);
ManagerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as { password?: string }).password;
    delete ret.__v;
    return ret;
  },
});