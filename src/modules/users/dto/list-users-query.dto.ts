import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationListParamsDto } from "src/common/dto/pagination-list-params.dto";
import { Role } from "../types/users.type";

export class ListUsersQueryDto extends PaginationListParamsDto {
  @ApiPropertyOptional({
    example: `${Role.MESSENGER},${Role.PROVIDER}`,
    description: 'Comma-separated list of roles to filter users. Available roles: ADMIN, CUSTOMER, PROVIDER, MANAGER, MESSENGER',
    default: undefined
  })
  @IsOptional()
  @IsString()
  role?: string;  
}