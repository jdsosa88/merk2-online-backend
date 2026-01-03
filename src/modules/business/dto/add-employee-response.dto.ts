import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Business } from "../schemas/business.schema";
import { EmploymentRequest } from "../schemas/employment-request.schema";

export class AddEmployeeResponseDto {
  
  @ApiProperty()
  business: Business; 

  @ApiPropertyOptional()
  employmentRequest?: EmploymentRequest;
}