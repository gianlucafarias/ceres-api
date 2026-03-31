import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OpsApiKeyGuard } from '../../common/guards/ops-api-key.guard';
import { OpsEventsApiKeyGuard } from '../../common/guards/ops-events-api-key.guard';
import { IngestOpsEventDto } from './dto/ingest-ops-event.dto';
import {
  QueryOpsEventsDto,
  QueryOpsSummaryDto,
} from './dto/query-ops-events.dto';
import { OpsEventsService } from './ops-events.service';

@Controller({ path: 'ops', version: '1' })
export class OpsEventsController {
  constructor(private readonly service: OpsEventsService) {}

  @UseGuards(OpsEventsApiKeyGuard)
  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(@Body() dto: IngestOpsEventDto) {
    const event = await this.service.ingestExternalEvent(dto);
    return {
      accepted: true,
      id: event.id,
    };
  }

  @UseGuards(OpsApiKeyGuard)
  @Get('events')
  list(@Query() query: QueryOpsEventsDto) {
    return this.service.listEvents(query);
  }

  @UseGuards(OpsApiKeyGuard)
  @Get('events/:id')
  async detail(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.service.getEventDetail(id);
    if (!result) {
      throw new NotFoundException('Evento no encontrado');
    }
    return result;
  }

  @UseGuards(OpsApiKeyGuard)
  @Get('summary')
  summary(@Query() query: QueryOpsSummaryDto) {
    return this.service.getSummary(query);
  }
}
