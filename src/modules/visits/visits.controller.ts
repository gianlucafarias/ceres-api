import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { applyHttpEtag } from '../../common/utils/http-etag';
import { VisitsRangeQueryDto } from './dto/visits.dto';
import { VisitsService } from './visits.service';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'visitas-flujo', version: '1' })
export class VisitsController {
  constructor(private readonly service: VisitsService) {}

  @Get()
  async getVisitasFlujo(
    @Query() query: VisitsRangeQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.service.getVisitasFlujo(query);
    if (applyHttpEtag(req, res, payload)) return;
    return payload;
  }
}
