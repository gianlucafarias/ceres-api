import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { Votante } from '../../entities/votante.entity';
import { VotanteController } from './votante.controller';
import { VotanteService } from './votante.service';

@Module({
  imports: [TypeOrmModule.forFeature([Votante])],
  controllers: [VotanteController],
  providers: [VotanteService, BotApiKeyGuard, AdminApiKeyGuard],
})
export class VotanteModule {}
