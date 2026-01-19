import { IsArray, IsBoolean, IsEmail, IsIn, IsMobilePhone, IsMongoId, IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";
import { Role, UserRole } from "../types/users.type";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Types } from "mongoose";
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { GeolocationDto } from '../../../common/dto/geolocation.dto';
import { ImageDto } from "src/common/dto/image.dto";
import { IsValidImage } from "src/common/decorators/image.decorator";

export class CreateUserDto {
  @ApiProperty({
    minLength: 2,
    maxLength: 50,
    example: 'John',
    description: 'User first name'
  })
  @Length(2, 50)
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({
    minLength: 2,
    maxLength: 50,
    example: 'Doe',
    description: 'User last name'
  })
  @Length(2, 50)
  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
    format: 'email'
  })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 50,
    example: 'Password123!',
    description: 'New password (8-50 characters, at least one uppercase letter, one lowercase letter, and one number)',
    writeOnly: true
  })
  @Length(8, 50)
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  )
  readonly password: string;

  @ApiPropertyOptional({
    example: '+5351657628',
    description: 'User phone number with country code'
  })
  @IsOptional()
  @IsMobilePhone()
  readonly phone?: string;

  @ApiPropertyOptional({
    enum: Role,
    enumName: 'UserRole',
    default: Role.CUSTOMER,
    description: 'User role'
  })
  @IsOptional()
  @IsIn([Role.ADMIN, Role.PROVIDER, Role.MANAGER, Role.MESSENGER, Role.CUSTOMER])
  role?: UserRole = Role.CUSTOMER;

  @ApiPropertyOptional({
    type: () => GeolocationDto,
    description: 'Geolocation of the user'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeolocationDto)
  readonly geolocation?: GeolocationDto;

  @ApiPropertyOptional({
    type: () => ImageDto,
    description: 'User avatar image'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageDto)
  @IsValidImage()
  readonly avatar?: ImageDto;
}

export class CreateProviderDto extends CreateUserDto {
  @ApiPropertyOptional({
    default: false,
    description: 'Indicates if provider can also work as messenger'
  })
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean = false;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of business IDs the provider is associated with',
    format: 'ObjectId'
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  businesses?: Types.ObjectId[];
}

export class CreateManagerDto extends CreateUserDto {
  @ApiPropertyOptional({
    default: false,
    description: 'Indicates if manager can also work as messenger'
  })
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean = false;

  @ApiProperty({
    description: 'Business ID the manager is assigned to',
    format: 'ObjectId'
  })
  @IsNotEmpty()
  @IsMongoId()
  business: Types.ObjectId;
}

export class CreateMessengerDto extends CreateUserDto {
  @ApiPropertyOptional({
    default: false,
    description: 'Indicates if messenger works for platform (not specific business)'
  })
  @IsOptional()
  @IsBoolean()
  isPlatformMessenger?: boolean = false;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of business IDs the messenger is associated with',
    format: 'ObjectId'
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  businesses?: Types.ObjectId[];
}