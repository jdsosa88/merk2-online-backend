import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'PROVIDER' | 'MESSENGER';
export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  MESSENGER = 'MESSENGER',
}
@Schema({ timestamps: true })
export class User extends Document {
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
        return ret;
  },
});