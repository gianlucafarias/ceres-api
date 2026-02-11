import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { ActivityService } from './activity.service';
import type { ActivityResponse } from './activity.service';
import { ActivityQueryDto, CreateActivityDto } from './dto/activity.dto';

@Controller({ path: 'activity', version: '1' })
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @UseGuards(AdminApiKeyGuard)
  @Get('recent')
  recent(@Query() query: ActivityQueryDto): Promise<ActivityResponse[]> {
    return this.service.getRecentActivities(query);
  }

  @UseGuards(BotApiKeyGuard)
  @Post()
  create(@Body() dto: CreateActivityDto): Promise<ActivityResponse> {
    return this.service.createActivity(dto);
  }
}
