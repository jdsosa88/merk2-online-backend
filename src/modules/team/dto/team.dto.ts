import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { TeamRole } from '../types/team.type';

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'Ana' })
  @Length(2, 50)
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @Length(2, 50)
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'ana.messenger@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: '8-50 chars, upper, lower, number',
  })
  @Length(8, 50)
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiPropertyOptional({ example: '+5355555555' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: TeamRole, example: TeamRole.MESSENGER })
  @IsEnum(TeamRole)
  role: TeamRole;

  @ApiPropertyOptional({
    description: 'For MANAGER: also act as messenger',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional store IDs to assign immediately (messengers / manager-messengers)',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  storeIds?: string[];
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Length(2, 50)
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Length(2, 50)
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Optional new password',
  })
  @IsOptional()
  @Length(8, 50)
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'For MANAGER only' })
  @IsOptional()
  @IsBoolean()
  isMessenger?: boolean;
}

export class AssignTeamMemberStoresDto {
  @ApiProperty({
    type: [String],
    description: 'Store IDs where this messenger will provide delivery service',
  })
  @IsArray()
  @IsMongoId({ each: true })
  storeIds: string[];
}
