import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpsApiKeyGuard } from '../../common/guards/ops-api-key.guard';
import { OpsEventsApiKeyGuard } from '../../common/guards/ops-events-api-key.guard';
import { HttpModule } from '../../shared/http/http.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { MetricsService } from './metrics.service';
import { OpsMetricsController } from './ops-metrics.controller';
import { OpsNotificationsController } from './ops-notifications.controller';
import { OpsNotificationsService } from './ops-notifications.service';

@Global()
@Module({
  imports: [ConfigModule, HttpModule, RedisModule],
  controllers: [OpsMetricsController, OpsNotificationsController],
  providers: [
    MetricsService,
    OpsNotificationsService,
    OpsApiKeyGuard,
    OpsEventsApiKeyGuard,
  ],
  exports: [MetricsService, OpsNotificationsService],
})
export class ObservabilityModule {}
