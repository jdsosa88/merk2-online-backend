import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  BROADCAST_NOTIFICATION_TYPES,
  BroadcastNotificationType,
  NotificationType,
} from '../types/notification.type';

export class BroadcastNotificationDto {
  @ApiProperty({
    enum: BROADCAST_NOTIFICATION_TYPES,
    example: NotificationType.INFO,
  })
  @IsEnum(BROADCAST_NOTIFICATION_TYPES)
  type: BroadcastNotificationType;

  @ApiProperty({ example: 'Nueva actualización disponible' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Consulta las novedades de Merk2' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body: string;

  @ApiPropertyOptional({
    description: 'Contenido largo mostrado en la pantalla de detalle',
    example: 'Hemos añadido nuevas funciones de entrega...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;
}
