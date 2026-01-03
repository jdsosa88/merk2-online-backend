import { Types } from "mongoose";
import { CreateManagerDto, CreateMessengerDto, CreateProviderDto, CreateUserDto } from "../dto/create-user.dto";
import { User } from "../schemas/user.schema";
import { ICreateManager, ICreateMessenger, ICreateUser, IUpdateUserDto } from "./users.interface";
import { UpdateUserAllDto, UpdateUserDto } from "../dto/update-user.dto";
import { UserRole } from "./users.type";

export type CreateUserFactoryDto = 
CreateUserDto 
| CreateProviderDto 
| CreateManagerDto 
| CreateMessengerDto 
| ICreateUser
| ICreateManager
| ICreateMessenger;

export type UpdateUserFactoryDto = UpdateUserDto | UpdateUserAllDto | IUpdateUserDto;

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