import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Geolocation } from "src/common/schemas/geolocation.schema";
import { Image } from "src/common/schemas/image.schema";
import { Role, UserRole } from "../types/users.type";

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {

  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: String, minlength: 2, maxlength: 50, required: false })
  firstName?: string;

  @Prop({ type: String, minlength: 2, maxlength: 50, required: false })
  lastName?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String, required: false, unique: true, sparse: true })
  googleId?: string

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: String, maxlength: 11, required: false, unique: true, sparse: true })
  phone?: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({
    required: true,
    enum: [Role.ADMIN, Role.PROVIDER, Role.MANAGER, Role.MESSENGER, Role.CUSTOMER],
    default: Role.CUSTOMER
  })
  role: UserRole;

  @Prop({ type: Geolocation, required: false })
  geolocation?: Geolocation;

  @Prop({ type: Types.ObjectId, ref: 'Image', required: false })
  avatar?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as { password?: string }).password;
    delete ret.__v;
    return ret;
  },
});