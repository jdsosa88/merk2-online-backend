import { IsArray, IsBoolean, IsEmail, IsEnum, IsMongoId, IsOptional, IsPhoneNumber, IsString, Length, Matches, ValidateNested } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Types } from "mongoose";
import { Role, UserRole } from "../types/users.type";
import { GeolocationDto } from "src/common/dto/geolocation.dto";
import { Type } from "class-transformer";
import { ImageDto } from "src/common/dto/image.dto";
import { IsValidImage } from "src/common/decorators/image.decorator";

export class UpdateUserDto {
  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 50,
    example: 'UpdatedFirstName',
    description: 'User first name'
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  readonly firstName?: string;

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 50,
    example: 'UpdatedLastName',
    description: 'User last name'
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  readonly lastName?: string;

  @ApiPropertyOptional({
    example: 'updated.email@example.com',
    description: 'User email address',
    format: 'email'
  })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({
    example: '+5351657628',
    description: 'User phone number with country code'
  })
  @IsOptional()
  @IsPhoneNumber()
  readonly phone?: string;

  @ApiPropertyOptional({
    enum: Role,
    enumName: 'UserRole',
    description: 'User role (admin only)'
  })
  @IsOptional()
  @IsEnum(Role)
  role?: UserRole;

  @ApiPropertyOptional({
    minLength: 8,
    maxLength: 50,
    example: 'UpdatedPass123!',
    description: 'New password (8-50 characters, at least one uppercase letter, one lowercase letter, and one number)',
    writeOnly: true
  })
  @IsOptional()
  @Length(8, 50)
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  )
  password?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'User active status (admin only)'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'User phone verification status (admin only)'
  })
  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  @ApiPropertyOptional({
    type: () => GeolocationDto,
    description: 'Geolocation of the user'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeolocationDto)
  geolocation?: GeolocationDto;

  @ApiPropertyOptional({
    type: () => ImageDto,
    description: 'User avatar image'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageDto)
  @IsValidImage()
  avatar?: ImageDto;
}

export class UpdateUserAllDto extends UpdateUserDto {
  @ApiPropertyOptional({
    description: 'For PROVIDER role: indicates if provider can also work as messenger'
  })
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean;

  @ApiPropertyOptional({
    description: 'For MESSENGER role: indicates if messenger works for platform (not specific business)'
  })
  @IsOptional()
  @IsBoolean()
  isPlatformMessenger?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'For PROVIDER/MESSENGER roles: array of business IDs',
    format: 'ObjectId'
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  businesses?: Types.ObjectId[];

  @ApiPropertyOptional({
    type: String,
    description: 'For MANAGER role: business ID assigned to',
    format: 'ObjectId'
  })
  @IsOptional()
  @IsMongoId()
  business?: Types.ObjectId;
}