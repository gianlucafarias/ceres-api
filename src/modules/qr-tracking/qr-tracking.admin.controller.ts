import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { OpsApiKeyGuard } from '../../common/guards/ops-api-key.guard';
import { QrTracking } from '../../entities/qr-tracking.entity';
import {
  CreateQrTrackingDto,
  QrTrackingIdParamDto,
  QrTrackingQueryDto,
} from './dto/qr-tracking.dto';
import { QrTrackingService } from './qr-tracking.service';

@UseGuards(OpsApiKeyGuard)
@Controller({ path: 'qr-tracking', version: '1' })
export class QrTrackingAdminController {
  constructor(
    private readonly service: QrTrackingService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async listar(@Query() query: QrTrackingQueryDto, @Req() req: Request) {
    const items = await this.service.findAll(query);
    return {
      success: true,
      data: items.map((item) => serializeTracking(item, req, this.config)),
    };
  }

  @Get(':id')
  async detalle(@Param() params: QrTrackingIdParamDto, @Req() req: Request) {
    const item = await this.service.findOne(params.id);
    return {
      success: true,
      data: serializeTracking(item, req, this.config),
    };
  }

  @Post()
  async crear(@Body() dto: CreateQrTrackingDto, @Req() req: Request) {
    const item = await this.service.create(dto);
    return {
      success: true,
      data: serializeTracking(item, req, this.config),
    };
  }

  @Delete(':id')
  async eliminar(@Param() params: QrTrackingIdParamDto) {
    const deleted = await this.service.delete(params.id);

    if (!deleted) {
      throw new NotFoundException({
        success: false,
        error: 'QR tracking no encontrado',
      });
    }

    return {
      success: true,
      message: 'QR tracking eliminado correctamente',
    };
  }
}

function serializeTracking(
  tracking: QrTracking,
  req: Request,
  config: ConfigService,
) {
  return {
    id: tracking.id,
    slug: tracking.slug,
    name: tracking.name,
    targetUrl: tracking.targetUrl,
    redirectUrl: buildRedirectUrl(tracking.slug, req, config),
    scanCount: tracking.scanCount,
    lastScannedAt: tracking.lastScannedAt?.toISOString() ?? null,
    createdAt: tracking.createdAt.toISOString(),
    updatedAt: tracking.updatedAt.toISOString(),
  };
}

function buildRedirectUrl(
  slug: string,
  req: Request,
  config: ConfigService,
): string {
  const configuredOrigin =
    getFirstForwardedValue(req.headers['x-public-origin']) ||
    config.get<string>('QR_TRACKING_PUBLIC_ORIGIN')?.trim();
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const protocol =
    typeof forwardedProto === 'string'
      ? forwardedProto.split(',')[0].trim()
      : req.protocol;
  const host =
    getFirstForwardedValue(forwardedHost) || req.get('host') || 'localhost';
  const origin =
    configuredOrigin?.replace(/\/+$/g, '') || `${protocol}://${host}`;

  return `${origin}/${slug}`;
}

function getFirstForwardedValue(
  value: string | string[] | undefined,
): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue?.split(',')[0]?.trim() || undefined;
}
