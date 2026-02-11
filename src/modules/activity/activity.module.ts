import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { ActivityLog } from '../../entities/activity-log.entity';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  controllers: [ActivityController],
  providers: [ActivityService, AdminApiKeyGuard, BotApiKeyGuard],
})
export class ActivityModule {}
