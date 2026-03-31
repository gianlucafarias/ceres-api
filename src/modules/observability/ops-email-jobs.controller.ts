import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OpsEventsApiKeyGuard } from '../../common/guards/ops-events-api-key.guard';
import { EnqueueEmailJobDto } from './dto/enqueue-email-job.dto';
import { OpsEmailQueueService } from './ops-email-queue.service';

@UseGuards(OpsEventsApiKeyGuard)
@Controller({ path: 'ops/jobs', version: '1' })
export class OpsEmailJobsController {
  constructor(private readonly queue: OpsEmailQueueService) {}

  @Post('email')
  @HttpCode(HttpStatus.ACCEPTED)
  enqueue(@Body() dto: EnqueueEmailJobDto) {
    return this.queue.enqueue(dto);
  }
}
