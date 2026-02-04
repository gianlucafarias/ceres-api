import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { VisitsRangeQueryDto } from './dto/visits.dto';
import { VisitsService } from './visits.service';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'visitas-flujo', version: '1' })
export class VisitsController {
  constructor(private readonly service: VisitsService) {}

  @Get()
  getVisitasFlujo(@Query() query: VisitsRangeQueryDto) {
    return this.service.getVisitasFlujo(query);
  }
}
