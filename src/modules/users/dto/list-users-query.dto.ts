import { IsOptional, IsString } from "class-validator";
import { PaginationListParamsDto } from "src/common/dto/pagination-list-params.dto";

export class ListUsersQueryDto extends PaginationListParamsDto {

  @IsOptional()
  @IsString()
  role?: string;  
}