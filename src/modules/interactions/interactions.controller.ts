import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  InteractionsCountQueryDto,
  InteractionsGroupParamsDto,
  InteractionsRangeParamsDto,
} from './dto/interactions.dto';
import { InteractionsService } from './interactions.service';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'interactions', version: '1' })
export class InteractionsController {
  constructor(private readonly service: InteractionsService) {}

  @Get('last-week/count/:start_date/:end_date/:group_by')
  grouped(@Param() params: InteractionsGroupParamsDto) {
    return this.service.getInteractionsLastWeek(params);
  }

  @Get('today')
  today() {
    return this.service.getInteractionsToday();
  }

  @Get('count/:start_date/:end_date')
  countRange(@Param() params: InteractionsRangeParamsDto) {
    return this.service.getInteractionsCountByDateRange(params);
  }

  @Get('count')
  count(@Query() query: InteractionsCountQueryDto) {
    return this.service.getInteractionsCount(query);
  }
}
