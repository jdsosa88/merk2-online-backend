import { Types } from "mongoose";
import { CreateManagerDto, CreateMessengerDto, CreateProviderDto, CreateUserDto } from "../dto/create-user.dto";
import { Role, User, UserRole } from "../schemas/user.schema";
import { ICreateUser, IUpdateUserDto } from "./users.interface";
import { UpdateManagerDto, UpdateMessengerDto, UpdateProviderDto, UpdateUserDto } from "../dto/update-user.dto";

export type CreateUserFactoryDto = CreateUserDto | CreateProviderDto | CreateManagerDto | CreateMessengerDto | ICreateUser;

export type UpdateUserFactoryDto = UpdateUserDto | UpdateProviderDto | UpdateManagerDto | UpdateMessengerDto | IUpdateUserDto;

export type CreateUserParams = {
  createUserDto: CreateUserFactoryDto;
}

export type UpdateUserParams = {
  updateUserDto: UpdateUserFactoryDto;
  userId: Types.ObjectId; 
}

export type ChangeRoleParams = {
  updateUserDto: UpdateUserFactoryDto;
  existentUser: User;
}

export type SchemaData = {   
  __t?: string,
  role: UserRole;
}