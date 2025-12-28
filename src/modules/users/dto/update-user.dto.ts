import { IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsMongoId, IsOptional, IsPhoneNumber, IsString, Length, ValidateNested } from "class-validator";
import { Role, UserRole } from "../schemas/user.schema";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Types } from "mongoose";
import { GeolocationDto } from "src/common/dto/geolocation.dto";
import { Type } from "class-transformer";

export class UpdateUserDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 50, example: 'User' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  readonly firstName?: string;

  @ApiPropertyOptional({ minLength: 2, maxLength: 50, example: 'Example' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  readonly lastName?: string;

  @ApiPropertyOptional({ example: 'user.example@email.com' })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({ example: '+5351657628' })
  @IsOptional()
  @IsPhoneNumber()
  readonly phone?: string;

  @ApiPropertyOptional({ enum: Role, example: 'PROVIDER' })
  @IsOptional()
  @IsEnum(Role)
  role?: UserRole;

  @ApiPropertyOptional({ minLength: 8, maxLength: 50, example: 'pass1234' })
  @IsOptional()
  @IsString()
  @Length(8, 50)
  password?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  @ApiPropertyOptional({ type: () => GeolocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeolocationDto)
  readonly geolocation?: GeolocationDto;
}


export class UpdateProviderDto extends UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  businesses?: Types.ObjectId[];
}

export class UpdateManagerDto extends UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsMongoId()
  business?: Types.ObjectId;
}

export class UpdateMessengerDto extends UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPlatformMessenger?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  businesses?: Types.ObjectId[];
}