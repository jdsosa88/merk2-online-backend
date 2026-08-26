import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from 'mongoose';
import { User } from "./user.schema";

export type ManagerDocument = HydratedDocument<User>;

@Schema()
export class Manager extends User {
  @Prop({ required: true, default: false })
  isMessenger: boolean;

  /** Provider who created / employs this manager (team). */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  employer?: Types.ObjectId;

  /** @deprecated Prefer `employer` + stores. Kept for legacy Business module. */
  @Prop({
    type: Types.ObjectId,
    ref: 'Business',
    required: false,
  })
  business?: Types.ObjectId;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Store',
    required: true,
    default: [],
  })
  stores: Types.ObjectId[];
}

export const ManagerSchema = SchemaFactory.createForClass(Manager);
ManagerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as { password?: string }).password;
    delete ret.__v;
    return ret;
  },
});