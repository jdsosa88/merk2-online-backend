import { IsEmail, IsIn, IsMobilePhone, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { Role, UserRole } from "../schemas/user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ minLength: 2, maxLength: 50, example: 'User' })
  @Length(2, 50)
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({ minLength: 2, maxLength: 50, example: 'Example' })
  @Length(2, 50)
  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @ApiProperty({ example: 'user.example@email.com' })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ minLength: 8, maxLength: 50, example: 'pass1234' })
  @Length(8, 50)
  @IsString()
  @IsNotEmpty()
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