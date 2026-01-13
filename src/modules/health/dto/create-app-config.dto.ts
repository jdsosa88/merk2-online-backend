import { IsObject, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PlatformConfigDto {  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  buildNumber?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  buildVersion?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  minVersion?: string;
}

export class CreateAppConfigDto {
  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => PlatformConfigDto)
  android: PlatformConfigDto;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => PlatformConfigDto)
  ios: PlatformConfigDto;
}