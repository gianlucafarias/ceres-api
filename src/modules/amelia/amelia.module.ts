import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';
import { AmeliaTurno } from '../../entities/amelia-turno.entity';
import { AmeliaController } from './amelia.controller';
import { AmeliaService } from './amelia.service';

@Module({
  imports: [TypeOrmModule.forFeature([AmeliaTurno, ActivityLog])],
  controllers: [AmeliaController],
  providers: [AmeliaService],
})
export class AmeliaModule {}
