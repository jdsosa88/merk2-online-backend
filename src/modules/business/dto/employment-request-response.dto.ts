import { User } from "src/modules/users/schemas/user.schema";
import { Business } from "../schemas/business.schema";
import { EmploymentRequest } from "../schemas/employment-request.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class EmploymentRequestResponseDto {
  @ApiPropertyOptional()
  user?: User;

  @ApiPropertyOptional()
  business?: Business;

  @ApiProperty()
  request: EmploymentRequest;
}