import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Length, IsNotEmpty } from "class-validator";

export class GeolocationDto {
  @ApiProperty({ minLength: 2, maxLength: 250, example: '123 Main St' })
  @Length(2, 250)
  @IsString()
  @IsNotEmpty()
  readonly address: string;

  @ApiPropertyOptional({ example: -34.6037 })
  @IsOptional()
  @IsNumber()
  readonly latitude?: number | null;

  @ApiPropertyOptional({ example: -58.3816 })
  @IsOptional()
  @IsNumber()
  readonly longitude?: number | null;
}
