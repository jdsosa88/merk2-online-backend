import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterPushTokenDto {
  @ApiProperty({
    example: 'fcm-device-token-or-apns-device-token',
    description:
      'Native device push token from getDevicePushTokenAsync (FCM on Android, APNs on iOS)',
  })
  @IsString()
  @MinLength(20)
  token: string;

  @ApiPropertyOptional({ enum: ['ios', 'android', 'web'] })
  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: 'ios' | 'android' | 'web';
}
