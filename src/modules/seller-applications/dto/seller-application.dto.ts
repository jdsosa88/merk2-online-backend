import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateSellerApplicationDto {
  @ApiProperty({ example: 'Juan Pérez', minLength: 2, maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  fullName: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+5351657628' })
  @IsString()
  @IsNotEmpty()
  @Length(7, 20)
  phone: string;

  @ApiProperty({ example: '85010112345', description: 'National ID (CI) as text' })
  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  ci: string;

  @ApiProperty({ example: 'Calle 1 #23, La Habana', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(5, 255)
  address: string;

  @ApiProperty({ example: 'LIC-12345', description: 'Commercial license as text', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  license: string;
}

export class ReviewSellerApplicationDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(approved|rejected)$/)
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  rejectionReason?: string;
}
