import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { IsEmail, IsIn, IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";
import { Role, UserRole } from "../user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 50, example: 'User' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  readonly firstName: string;

  @ApiPropertyOptional({ minLength: 2, maxLength: 50, example: 'Example' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  readonly lastName: string;

  @ApiPropertyOptional({ example: 'user.example@email.com' })
  @IsOptional()
  @IsEmail()
  readonly email: string;

  @ApiPropertyOptional({ example: '+5351657628' })
  @IsOptional()
  @IsPhoneNumber()
  readonly phone: string;

  @ApiPropertyOptional({ enum: Role, example: 'PROVIDER' })
  @IsOptional()
  @IsIn([Role.ADMIN, Role.PROVIDER, Role.MESSENGER, Role.CUSTOMER])
  role?: UserRole;

  @ApiPropertyOptional({ minLength: 8, maxLength: 50, example: 'pass1234' })
  password?: string;

  @ApiPropertyOptional({ example: true})
  isActive?: boolean;

}