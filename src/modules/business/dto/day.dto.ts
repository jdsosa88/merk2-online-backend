import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  Matches,
} from 'class-validator';

export class DayDto {
  @ApiProperty({
    type: Number,
    description: 'Day of the week (0 for Sunday, 6 for Saturday)',
    minimum: 0,
    maximum: 6,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(6)
  day: number;

  @ApiProperty({
    type: String,
    description: 'Name of the day (e.g., "Monday")',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Start hour in 24-hour format (e.g., "09:00")',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startHour must be a valid 24-hour time string (e.g., "09:00")',
  })
  startHour: string;

  @ApiProperty({
    type: String,
    description: 'End hour in 24-hour format (e.g., "17:00")',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endHour must be a valid 24-hour time string (e.g., "17:00")',
  })
  endHour: string;
}
