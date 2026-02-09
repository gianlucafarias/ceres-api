import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { DashboardCeresitoService } from './dashboard-ceresito.service';
import { DashboardCeresitoSummaryQueryDto } from './dto/dashboard-ceresito-summary.dto';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'dashboard/ceresito', version: '1' })
export class DashboardCeresitoController {
  constructor(private readonly service: DashboardCeresitoService) {}

  @Get('summary')
  getSummary(@Query() query: DashboardCeresitoSummaryQueryDto) {
    return this.service.getSummary(query);
  }
}
