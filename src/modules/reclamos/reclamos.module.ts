import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module';
import { GeocodeModule } from '../../shared/geocode/geocode.module';
import { ReclamosAdminController } from './reclamos.admin.controller';
import { ReclamosBotController } from './reclamos.bot.controller';
import { ReclamosHistorialService } from './reclamos-historial.service';
import { ReclamosRepository } from './reclamos.repository';
import { ReclamosService } from './reclamos.service';
import { ReclamosStatsService } from './reclamos-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reclamo, ReclamoHistorial]), GeocodeModule, ActivityLogModule],
  controllers: [ReclamosAdminController, ReclamosBotController],
  providers: [
    ReclamosService,
    ReclamosRepository,
    ReclamosHistorialService,
    ReclamosStatsService,
    AdminApiKeyGuard,
    BotApiKeyGuard,
  ],
})
export class ReclamosModule {}
