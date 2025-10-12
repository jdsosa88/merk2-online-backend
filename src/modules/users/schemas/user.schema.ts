import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type UserDocument = HydratedDocument<User>;

export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  MESSENGER = 'MESSENGER',
}
export type UserRole = keyof typeof Role;


@Schema({ timestamps: true })
export class User {

  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: false, unique: true, sparse: true })
  phone?: string;

  @Prop({ default: false })
  isPhoneVerified: boolean

  @Prop({ default: false })
  isActive: boolean;

  @Prop({
    required: true,
    enum: [Role.ADMIN, Role.PROVIDER, Role.MESSENGER, Role.CUSTOMER],
    default: 'CUSTOMER'
  })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as { password?: string }).password;
    delete ret.__v;
    return ret;
  },
});