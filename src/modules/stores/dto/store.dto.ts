import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { DayDto } from 'src/modules/business/dto/day.dto';
import { MessengerAssignmentType, StoreStatus } from '../types/store.type';

export class CreateStoreDto {
  @ApiProperty({ minLength: 2, maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  slogan?: string;

  @ApiProperty({ minLength: 2, maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  description: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(5, 255)
  address: string;

  @ApiProperty({ type: [DayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayDto)
  @IsNotEmpty()
  week: DayDto[];

  @ApiPropertyOptional({ enum: MessengerAssignmentType })
  @IsOptional()
  @IsEnum(MessengerAssignmentType)
  messengerAssignmentType?: MessengerAssignmentType;
}

export class UpdateStoreDto extends PartialType(CreateStoreDto) {}

export class UpdateStoreStatusDto {
  @ApiProperty({ enum: StoreStatus })
  @IsEnum(StoreStatus)
  status: StoreStatus;
}

export class AssignMessengerDto {
  @ApiProperty({ description: 'Messenger user ID' })
  @IsMongoId()
  @IsNotEmpty()
  messengerId: string;
}
