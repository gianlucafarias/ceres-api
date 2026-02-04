import { Controller, Get, Param, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AnyApiKeyGuard } from '../../common/guards/any-api-key.guard';
import { ReclamosPdfService } from './reclamos-pdf.service';

@UseGuards(AnyApiKeyGuard)
@Controller({ path: 'reclamos', version: '1' })
export class ReclamosPdfController {
  constructor(private readonly service: ReclamosPdfService) {}

  @Get(':id/pdf')
  async getPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdf = await this.service.generatePdfBuffer(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reclamo-${id}.pdf`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  }
}
