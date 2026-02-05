import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { ActivityService } from './activity.service';
import type { ActivityResponse } from './activity.service';
import { ActivityQueryDto } from './dto/activity.dto';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'activity', version: '1' })
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Get('recent')
  recent(@Query() query: ActivityQueryDto): Promise<ActivityResponse[]> {
    return this.service.getRecentActivities(query);
  }
}
