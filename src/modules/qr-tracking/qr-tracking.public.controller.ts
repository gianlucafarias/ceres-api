import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { QrTrackingSlugParamDto } from './dto/qr-tracking.dto';
import { QrTrackingService } from './qr-tracking.service';

@Controller({ path: 'qr', version: '1' })
export class QrTrackingPublicController {
  constructor(private readonly service: QrTrackingService) {}

  @Get(':slug')
  async redirect(
    @Param() params: QrTrackingSlugParamDto,
    @Res() res: Response,
  ) {
    const trackedTarget = await this.service.resolveTrackedTarget(params.slug);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, trackedTarget.targetUrl);
  }
}
