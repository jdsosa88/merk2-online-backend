import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from 'mongoose';
import { User } from "./user.schema";

export type ProviderDocument = HydratedDocument<User>;

@Schema()
export class Provider extends User {
  @Prop({ required: true, default: false })
  isMessenger: boolean;

  @Prop({ 
    type: [Types.ObjectId], 
    ref: 'Business',
    required: true,
    default: []
  })
  businesses: Types.ObjectId[];
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
ProviderSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as { password?: string }).password;
    delete ret.__v;
    return ret;
  },
});