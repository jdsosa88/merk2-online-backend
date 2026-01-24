import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsArray, IsNotEmpty } from "class-validator";
import { PaginationListParamsDto } from "src/common/dto/pagination-list-params.dto";
import { BusinessStatus, BusinessStatusType } from "../types/business.type";
import { Type } from "class-transformer";

export class ListBusinessQueryDto extends PaginationListParamsDto {
  @ApiPropertyOptional({
    example: `${BusinessStatus.ACCEPTED},${BusinessStatus.REQUESTED}`,
    description: 'Comma-separated list of business statuses to filter. Available statuses: requested, accepted, pending, disabled',
    default: undefined
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: 'Restaurant',
    description: 'Partial name of the business to search for',
    default: undefined
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '60d5f9f8f8b7a12c3c4d5e6f,60d5f9f8f8b7a12c3c4d5e70',
    description: 'Comma-separated list of category IDs to filter businesses',
    default: undefined
  })
  @IsOptional()
  @IsString()
  categories?: string;

  @ApiPropertyOptional({
    example: '60d5f9f8f8b7a12c3c4d5e6f',
    description: 'Owner ID to filter businesses',
    default: undefined
  })
  @IsOptional()
  @IsString()
  owner?: string;
}