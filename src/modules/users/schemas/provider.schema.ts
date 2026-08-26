import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from 'mongoose';
import { User } from "./user.schema";
import { SellerProfile, SellerProfileSchema } from "./seller-profile.schema";

export type ProviderDocument = HydratedDocument<User>;

@Schema()
export class Provider extends User {
  @Prop({ required: true, default: false })
  isMessenger: boolean;

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

  @Prop({ type: SellerProfileSchema, required: false })
  sellerProfile?: SellerProfile;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
ProviderSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as { password?: string }).password;
    delete ret.__v;
    return ret;
  },
});
