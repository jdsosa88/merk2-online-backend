import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SellerProfile {
  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: String, required: true, trim: true })
  ci: string;

  @Prop({ type: String, required: true, trim: true })
  phone: string;

  @Prop({ type: String, required: true, trim: true })
  email: string;

  @Prop({ type: String, required: true, trim: true })
  address: string;

  @Prop({ type: String, required: true, trim: true })
  license: string;
}

export const SellerProfileSchema = SchemaFactory.createForClass(SellerProfile);
