import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { TipoReclamo } from '../../entities/tipo-reclamo.entity';
import { TiposReclamoController } from './tipos-reclamo.controller';
import { TiposReclamoService } from './tipos-reclamo.service';

@Module({
  imports: [TypeOrmModule.forFeature([TipoReclamo])],
  controllers: [TiposReclamoController],
  providers: [TiposReclamoService, AdminApiKeyGuard],
})
export class TiposReclamoModule {}
