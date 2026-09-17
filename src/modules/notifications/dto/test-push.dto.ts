import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TestPushDto {
  @ApiPropertyOptional({ example: 'Prueba Merk2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: 'Notificación de prueba enviada desde el backend' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  body?: string;
}
