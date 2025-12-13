import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";
import { HydratedDocument, Types } from "mongoose";

export type MessengerDocument = HydratedDocument<User>;

@Schema()
export class Messenger extends User {
  @Prop({ required: true, default: false })
  isPlatformMessenger: boolean;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Business',
    required: true,
    default: []
  })
  businesses: Types.ObjectId[];
}

export const MessengerSchema = SchemaFactory.createForClass(Messenger);
MessengerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as { password?: string }).password;
    delete ret.__v;
    return ret;
  },
});