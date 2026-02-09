import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { ActivityLog } from '../../entities/activity-log.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { AdminBootstrapController } from './admin-bootstrap.controller';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reclamo, ReclamoHistorial, ActivityLog])],
  controllers: [AdminBootstrapController],
  providers: [AdminBootstrapService, AdminApiKeyGuard],
})
export class AdminBootstrapModule {}
