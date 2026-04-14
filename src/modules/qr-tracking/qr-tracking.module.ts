import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpsApiKeyGuard } from '../../common/guards/ops-api-key.guard';
import { QrTracking } from '../../entities/qr-tracking.entity';
import { QrTrackingAdminController } from './qr-tracking.admin.controller';
import { QrTrackingPublicController } from './qr-tracking.public.controller';
import { QrTrackingService } from './qr-tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([QrTracking])],
  controllers: [QrTrackingPublicController, QrTrackingAdminController],
  providers: [QrTrackingService, OpsApiKeyGuard],
})
export class QrTrackingModule {}
