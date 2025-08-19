import { IsEmail, IsIn, IsMobilePhone, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";
import { Role, UserRole } from "../user.schema";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  readonly firstName: string;

  @IsNotEmpty()
  @IsString() 
  @Length(2, 50)
  readonly lastName: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()  
  @Length(8, 50)
  readonly password: string;

  @IsOptional()
  @IsMobilePhone()
  readonly phone: string;

  @IsOptional()
  @IsIn([Role.ADMIN, Role.PROVIDER, Role.MESSENGER, Role.CUSTOMER])
  role?: UserRole;
}