import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthUser } from 'src/common/decorators/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { NotificationsService } from './notifications.service';
import { TestPushDto } from './dto/test-push.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a test push to the authenticated user devices',
  })
  async sendTest(
    @AuthUser('_id') userId: Types.ObjectId,
    @Body() dto: TestPushDto,
  ): Promise<ApiResponseDto<{ tokenCount: number; title: string; body: string }>> {
    const result = await this.notificationsService.sendTestPushToUser(
      userId.toString(),
      dto.title,
      dto.body,
    );

    if (result.tokenCount === 0) {
      throw new BadRequestException(
        'No expo push tokens registered for this user. Open the mobile app, grant notification permission, and login first.',
      );
    }

    return new ApiResponseDto('Test push sent', result);
  }
}
