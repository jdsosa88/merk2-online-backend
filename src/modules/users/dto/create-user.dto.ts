import { IsArray, IsBoolean, IsDefined, IsEmail, IsIn, IsMobilePhone, IsMongoId, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { Role, UserRole } from "../types/users.type";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Types } from "mongoose";

import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { GeolocationDto } from '../../../common/dto/geolocation.dto';
import { ImageDto } from "src/common/dto/image.dto";
import { IsValidImage } from "src/common/decorators/image.decorator";

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
  @IsIn([Role.ADMIN, Role.PROVIDER, Role.MANAGER, Role.MESSENGER, Role.CUSTOMER])
  role?: UserRole;

  @ApiPropertyOptional({ type: () => GeolocationDto, description: 'Geolocation of the user' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeolocationDto)
  readonly geolocation?: GeolocationDto;

  @ApiPropertyOptional({ type: () => ImageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageDto)
  @IsValidImage()
  readonly avatar?: ImageDto;
}

export class CreateProviderDto extends CreateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  businesses?: Types.ObjectId[];
}

export class CreateManagerDto extends CreateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsMongoId()
  business: Types.ObjectId;
}

export class CreateMessengerDto extends CreateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isPlatformMessenger?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  businesses?: Types.ObjectId[];
}

