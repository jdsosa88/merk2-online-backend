import { IsEmail, IsIn, IsMobilePhone, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";
import { Role, UserRole } from "../schemas/user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ minLength: 2, maxLength: 50, example: 'User' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  readonly firstName: string;

  @ApiProperty({ minLength: 2, maxLength: 50, example: 'Example' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  readonly lastName: string;

  @ApiProperty({ example: 'user.example@email.com' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ minLength: 8, maxLength: 50, example: 'pass1234' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly password: string;

  @ApiProperty({ example: '+5351657628' })
  @IsOptional()
  @IsMobilePhone()
  readonly phone?: string;

  @ApiPropertyOptional({ enum: Role, example: 'CUSTOMER' })
  @IsOptional()
  @IsIn([Role.ADMIN, Role.PROVIDER, Role.MESSENGER, Role.CUSTOMER])
  role?: UserRole;
}