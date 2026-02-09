import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { OpsApiKeyGuard } from '../../common/guards/ops-api-key.guard';
import { MetricsService } from './metrics.service';

@UseGuards(OpsApiKeyGuard)
@Controller({ path: 'ops', version: '1' })
export class OpsMetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  async getMetrics(@Res() response: Response): Promise<void> {
    const payload = await this.metrics.getMetrics();
    response.setHeader('Content-Type', this.metrics.getContentType());
    response.status(200).send(payload);
  }
}
