import { GeolocationDto } from "src/common/dto/geolocation.dto";
import { Image } from "src/common/schemas/image.schema";
import { UserRole } from "./users.type";

export interface ICreateUser {
  readonly firstName: string;
  readonly lastName?: string;
  readonly email: string;
  readonly googleId: string;
  readonly password: string;
  readonly phone?: string;
  role?: UserRole;
  readonly isActive: boolean;
  readonly isPhoneVerified: boolean;
  readonly geolocation?: GeolocationDto;
}

export interface IUpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  googleId?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  isPhoneVerified?: boolean;
  geolocation?: GeolocationDto;
  avatar?: Image;
}