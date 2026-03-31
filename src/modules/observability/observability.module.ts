import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpsApiKeyGuard } from '../../common/guards/ops-api-key.guard';
import { OpsEventsApiKeyGuard } from '../../common/guards/ops-events-api-key.guard';
import { OpsEventLog } from '../../entities/ops-event-log.entity';
import { HttpModule } from '../../shared/http/http.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { MetricsService } from './metrics.service';
import { OpsEmailJobsController } from './ops-email-jobs.controller';
import { OpsEmailQueueService } from './ops-email-queue.service';
import { OpsEmailService } from './ops-email.service';
import { OpsEventsController } from './ops-events.controller';
import { OpsEventsService } from './ops-events.service';
import { OpsMetricsController } from './ops-metrics.controller';
import { OpsNotificationsController } from './ops-notifications.controller';
import { OpsNotificationsService } from './ops-notifications.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    RedisModule,
    TypeOrmModule.forFeature([OpsEventLog]),
  ],
  controllers: [
    OpsMetricsController,
    OpsNotificationsController,
    OpsEventsController,
    OpsEmailJobsController,
  ],
  providers: [
    MetricsService,
    OpsNotificationsService,
    OpsEventsService,
    OpsEmailService,
    OpsEmailQueueService,
    OpsApiKeyGuard,
    OpsEventsApiKeyGuard,
  ],
  exports: [
    MetricsService,
    OpsNotificationsService,
    OpsEventsService,
    OpsEmailService,
    OpsEmailQueueService,
  ],
})
export class ObservabilityModule {}
