import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { CertificadosService } from './certificados.service';
import { CrearCertificadoDto } from './dto/certificados.dto';

@UseGuards(BotApiKeyGuard)
@Controller({ path: 'certificados', version: '1' })
export class CertificadosController {
  constructor(private readonly service: CertificadosService) {}

  @Post('crear')
  async crear(@Body() dto: CrearCertificadoDto, @Req() req: Request) {
    const relativePath = await this.service.crear(dto);
    return {
      pdfUrl: toPublicUrl(req, relativePath),
    };
  }
}

function toPublicUrl(req: Request, relativePath: string): string {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol =
    typeof forwardedProto === 'string'
      ? forwardedProto.split(',')[0].trim()
      : req.protocol;
  const host = req.get('host') ?? 'localhost';
  return `${protocol}://${host}${relativePath}`;
}
