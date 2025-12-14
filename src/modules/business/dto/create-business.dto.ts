import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { GeolocationDto } from 'src/common/dto/geolocation.dto';
import { DayDto } from './day.dto';

export class CreateBusinessDto {
  @ApiProperty({
    type: String,
    description: 'Name of the business',
    example: 'My business name',
    minLength: 2,
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;

  @ApiProperty({
    type: String,
    description: 'Description of the business',
    example: 'A description of the business',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  description: string;

  @ApiProperty({
    type: GeolocationDto,
    description: 'Geolocation of the business',
  })
  @Type(() => GeolocationDto)
  @ValidateNested()
  @IsNotEmpty()
  geolocation: GeolocationDto;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of phone numbers for the business',
    example: ['123-456-7890', '098-765-4321'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @ApiProperty({
    type: [DayDto],
    description: 'Weekly schedule of the business',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayDto)
  @IsNotEmpty()
  week: DayDto[];
}
