import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";
import { HydratedDocument, Types } from "mongoose";

export type MessengerDocument = HydratedDocument<User>;

@Schema()
export class Messenger extends User {
  @Prop({ required: true, default: false })
  isPlatformMessenger: boolean;

  /** Provider who created / employs this messenger (team). */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  employer?: Types.ObjectId;

  /** @deprecated Use `stores` instead. Kept for legacy Business module. */
  @Prop({
    type: [Types.ObjectId],
    ref: 'Business',
    required: true,
    default: []
  })
  businesses: Types.ObjectId[];

  @Prop({
    type: [Types.ObjectId],
    ref: 'Store',
    required: true,
    default: []
  })
  stores: Types.ObjectId[];
}

export const MessengerSchema = SchemaFactory.createForClass(Messenger);
MessengerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as { password?: string }).password;
    delete ret.__v;
    return ret;
  },
});
