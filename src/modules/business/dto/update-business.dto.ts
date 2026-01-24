import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { GeolocationDto } from 'src/common/dto/geolocation.dto';
import { DayDto } from './day.dto';
import { ImageDto } from 'src/common/dto/image.dto';
import { IsValidImage } from 'src/common/decorators/image.decorator';
import { BusinessStatus } from '../types/business.type';

export class UpdateBusinessByOwnerDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Name of the business',
    example: 'My business name',
    minLength: 2,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  name?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Description of the business',
    example: 'A description of the business',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  description?: string;

  @ApiPropertyOptional({ type: () => GeolocationDto, description: 'Geolocation of the business' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeolocationDto)
  geolocation?: GeolocationDto;

  @ApiPropertyOptional({ type: () => ImageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageDto)
  @IsValidImage()
  pick?: ImageDto;

  @ApiPropertyOptional({ type: () => ImageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageDto)
  @IsValidImage()
  portalPick?: ImageDto;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of phone numbers for the business',
    example: ['123-456-7890', '098-765-4321'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @ApiPropertyOptional({
    type: [DayDto],
    description: 'Weekly schedule of the business',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayDto)
  week?: DayDto[];

  @ApiPropertyOptional({
    enum: BusinessStatus,
    description: 'Status of the business',
  })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;


  @ApiPropertyOptional({
    type: [String],
    description: 'List of categories ids availables for the business',
    example: ['69554e327f1dd0e6bda76601', '69554e327f1dd0e6bda76612'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categories?: string[];
}


export class UpdateBusinessByAdminDto extends UpdateBusinessByOwnerDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Owner ID (User ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  owner?: string;
}