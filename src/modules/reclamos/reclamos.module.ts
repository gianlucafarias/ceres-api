import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { ReclamosAdminController } from './reclamos.admin.controller';
import { ReclamosBotController } from './reclamos.bot.controller';
import { ReclamosService } from './reclamos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reclamo, ReclamoHistorial])],
  controllers: [ReclamosAdminController, ReclamosBotController],
  providers: [ReclamosService, AdminApiKeyGuard, BotApiKeyGuard],
})
export class ReclamosModule {}
