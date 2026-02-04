import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncuestaPresupuesto } from '../../entities/encuesta-presupuesto.entity';
import { EncuestasAdminController } from './encuestas.admin.controller';
import { EncuestasPublicController } from './encuestas.public.controller';
import { EncuestasService } from './encuestas.service';

@Module({
  imports: [TypeOrmModule.forFeature([EncuestaPresupuesto])],
  controllers: [EncuestasPublicController, EncuestasAdminController],
  providers: [EncuestasService],
})
export class EncuestasModule {}
