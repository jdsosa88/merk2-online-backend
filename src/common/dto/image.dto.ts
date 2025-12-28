// src/common/dto/image.dto.ts (actualizado)
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, ValidateIf, IsNotEmpty } from "class-validator";

export class ImageDto {
  @ApiPropertyOptional({ example: 'profile.jpg' })
  @IsOptional()
  @ValidateIf(o => o.url === undefined)
  @IsString()
  @IsNotEmpty()
  readonly filename?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @ValidateIf(o => o.filename && !o.url)
  @IsString()
  @IsNotEmpty()
  readonly mimeType?: string;

  @ApiPropertyOptional({ example: '2048' })
  @IsOptional()
  @ValidateIf(o => o.filename && !o.url)
  @IsString()
  @IsNotEmpty()
  readonly size?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @ValidateIf(o => o.filename === undefined)
  @IsString()
  @IsNotEmpty()
  readonly url?: string;
}