// src/modules/business/dto/add-employee.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, ValidateNested, IsBoolean, IsArray, IsMongoId, IsString, Length } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Types } from "mongoose";
import { EmployeeType } from "../types/employees.type";


export class AddEmployeeDto {
  @ApiProperty({ example: 'employee@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: EmployeeType, example: EmployeeType.MANAGER })
  @IsEnum(EmployeeType)
  @IsNotEmpty()
  employeeType: EmployeeType;

  @ApiPropertyOptional({ minLength: 2, maxLength: 50, example: 'John' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @ApiPropertyOptional({ minLength: 2, maxLength: 50, example: 'Doe' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @ApiPropertyOptional({ example: '+5351657628' })
  @IsOptional()
  @IsString()
  phone?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean; 
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPlatformMessenger?: boolean;

  @ApiPropertyOptional({ type: [Types.ObjectId] })
  @IsOptional()
  @IsArray()
  businesses?: Types.ObjectId[]; 
}