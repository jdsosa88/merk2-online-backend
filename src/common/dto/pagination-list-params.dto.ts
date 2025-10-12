import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class PaginationListParamsDto {
  @ApiPropertyOptional({ minimum: 1, example: 2, default: 1 })
  @IsOptional()
  @Min(1)
  @IsInt()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, example: 10, default: 25 })
  @IsOptional()
  @Min(1)
  @IsInt()
  @Type(() => Number)
  perPage: number = 25;
}