import { IsEmail, IsIn, IsMobilePhone, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";
import { UserRole } from "../user.schema";

export class CreateUserDto {
  @IsString()
  @Length(2, 50)
  readonly firstName: string;

  @IsString() 
  @Length(2, 50)
  readonly lastName: string;

  @IsEmail()
  readonly email: string;

  @IsString()  
  @Length(8, 50)
  readonly password: string;

  @IsOptional()
  @IsMobilePhone()
  readonly phone: string;

  @IsOptional()
  @IsIn(['ADMIN', 'CUSTOMER', 'MANAGER', 'TRAINER', 'DOORMAN'])
  role?: UserRole;
}