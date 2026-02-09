import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { OpsEventsApiKeyGuard } from '../../common/guards/ops-events-api-key.guard';
import { OpsEventDto } from './dto/ops-event.dto';
import { OpsNotificationsService } from './ops-notifications.service';

@UseGuards(OpsEventsApiKeyGuard)
@Controller({ path: 'ops/notifications', version: '1' })
export class OpsNotificationsController {
  constructor(private readonly notifications: OpsNotificationsService) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  ingestEvent(@Body() event: OpsEventDto, @Req() request: Request) {
    this.notifications.ingestExternalEvent(event, {
      requestId: extractRequestId(request),
      clientIp: request.ip,
    });

    return { accepted: true };
  }
}

function extractRequestId(request: Request): string | undefined {
  const headerValue = request.headers['x-request-id'];
  if (typeof headerValue === 'string') {
    return headerValue;
  }
  if (Array.isArray(headerValue) && typeof headerValue[0] === 'string') {
    return headerValue[0];
  }

  return undefined;
}
