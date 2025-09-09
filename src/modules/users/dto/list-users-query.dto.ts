import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationListParamsDto } from "src/common/dto/pagination-list-params.dto";
import { Role } from "../user.schema";

export class ListUsersQueryDto extends PaginationListParamsDto {

  @ApiPropertyOptional({example: `${Role.MESSENGER}, ${Role.PROVIDER}`, default: 'undefined'})
  @IsOptional()
  @IsString()
  role?: string;  
}