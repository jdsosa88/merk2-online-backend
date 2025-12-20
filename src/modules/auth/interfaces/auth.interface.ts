import { User } from "src/modules/users/schemas/user.schema";

interface UserClientContext {
  ip: string;
  userAgent: string;
}

export interface AtuthParams<T> extends UserClientContext {
  dto: T;
}

export interface LoginParams extends UserClientContext {
  user: User;
}

export interface GoogleAuthParams extends UserClientContext {
  googleToken: string;
}

