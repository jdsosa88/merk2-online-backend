import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { IdDto } from 'src/common/dto/id.dto';
import { CheckPolicies } from 'src/modules/casl/decorators/policies.decorator';
import { NotificationsService } from './notifications.service';
import { TestPushDto } from './dto/test-push.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import {
  BroadcastNotificationPolicy,
  DeleteNotificationPolicy,
  ListNotificationsPolicy,
  ReadNotificationPolicy,
  UpdateNotificationPolicy,
} from './policies/notification.policies';
import { Notification } from './schemas/notification.schema';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @CheckPolicies(new ListNotificationsPolicy())
  @ApiOperation({ summary: 'List inbox notifications for the authenticated user (today + reservations)' })
  async list(
    @AuthUser('_id') userId: Types.ObjectId,
  ): Promise<ApiResponseDto<Notification[]>> {
    const items = await this.notificationsService.listForUser(userId.toString());
    return new ApiResponseDto('Notifications retrieved', items);
  }

  @Get('one')
  @CheckPolicies(new ReadNotificationPolicy())
  @ApiOperation({ summary: 'Get a single notification by id' })
  async findOne(
    @AuthUser('_id') userId: Types.ObjectId,
    @Query() idDto: IdDto,
  ): Promise<ApiResponseDto<Notification>> {
    const item = await this.notificationsService.findOneForUser(
      userId.toString(),
      idDto.id,
    );
    return new ApiResponseDto('Notification retrieved', item);
  }

  @Delete()
  @CheckPolicies(new DeleteNotificationPolicy())
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete one notification (?id=) or all visible inbox notifications',
  })
  async remove(
    @AuthUser('_id') userId: Types.ObjectId,
    @Query('id') id?: string,
  ): Promise<ApiResponseDto<{ deleted: number }>> {
    if (id) {
      await this.notificationsService.deleteOne(userId.toString(), id);
      return new ApiResponseDto('Notification deleted', { deleted: 1 });
    }
    const result = await this.notificationsService.deleteAllForUser(
      userId.toString(),
    );
    return new ApiResponseDto('Notifications deleted', result);
  }

  @Patch('read')
  @CheckPolicies(new UpdateNotificationPolicy())
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(
    @AuthUser('_id') userId: Types.ObjectId,
    @Query() idDto: IdDto,
  ): Promise<ApiResponseDto<Notification>> {
    const item = await this.notificationsService.markRead(
      userId.toString(),
      idDto.id,
    );
    return new ApiResponseDto('Notification marked as read', item);
  }

  @Post('read-all')
  @CheckPolicies(new UpdateNotificationPolicy())
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all visible inbox notifications as read' })
  async markAllRead(
    @AuthUser('_id') userId: Types.ObjectId,
  ): Promise<ApiResponseDto<{ updated: number }>> {
    const result = await this.notificationsService.markAllRead(
      userId.toString(),
    );
    return new ApiResponseDto('Notifications marked as read', result);
  }

  @Post('broadcast')
  @CheckPolicies(new BroadcastNotificationPolicy())
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin: broadcast app_update or info to all users (inbox + push)',
  })
  async broadcast(
    @Body() dto: BroadcastNotificationDto,
  ): Promise<ApiResponseDto<{ notifiedUsers: number }>> {
    const result = await this.notificationsService.broadcast(dto);
    return new ApiResponseDto('Broadcast sent', result);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies(new ListNotificationsPolicy())
  @ApiOperation({
    summary: 'Send a test push to the authenticated user devices',
  })
  async sendTest(
    @AuthUser('_id') userId: Types.ObjectId,
    @Body() dto: TestPushDto,
  ): Promise<
    ApiResponseDto<{ tokenCount: number; title: string; body: string }>
  > {
    const result = await this.notificationsService.sendTestPushToUser(
      userId.toString(),
      dto.title,
      dto.body,
    );

    if (result.tokenCount === 0) {
      throw new BadRequestException(
        'No device push tokens registered for this user. Open the mobile app, grant notification permission, and login first.',
      );
    }

    return new ApiResponseDto('Test push sent', result);
  }
}
