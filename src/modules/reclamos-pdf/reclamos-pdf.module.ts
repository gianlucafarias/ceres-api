import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnyApiKeyGuard } from '../../common/guards/any-api-key.guard';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { ReclamosPdfController } from './reclamos-pdf.controller';
import { ReclamosPdfService } from './reclamos-pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reclamo, ReclamoHistorial])],
  controllers: [ReclamosPdfController],
  providers: [ReclamosPdfService, AnyApiKeyGuard],
})
export class ReclamosPdfModule {}
