import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DutySchedule } from '../../entities/duty-schedule.entity';
import { Pharmacy } from '../../entities/pharmacy.entity';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module';
import { FarmaciasController } from './farmacias.controller';
import { FarmaciasService } from './farmacias.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacy, DutySchedule]), ActivityLogModule],
  controllers: [FarmaciasController],
  providers: [FarmaciasService],
})
export class FarmaciasModule {}
