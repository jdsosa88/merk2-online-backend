import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { IsEmail, IsIn, IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";
import { UserRole } from "../user.schema";

export class UpdateUserDto {

  @IsOptional()
  @IsString()
  @Length(2, 50)
  readonly firstName: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  readonly lastName: string;

  @IsOptional()
  @IsEmail()
  readonly email: string;  

  @IsOptional()
  @IsPhoneNumber()
  readonly phone: string;

  @IsOptional()
  @IsIn(['ADMIN', 'CUSTOMER', 'MANAGER', 'TRAINER', 'DOORMAN'])
  readonly role?: UserRole;
  
  password?: string;
  isActive?: boolean;

}