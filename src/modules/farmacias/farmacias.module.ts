import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DutySchedule } from '../../entities/duty-schedule.entity';
import { Pharmacy } from '../../entities/pharmacy.entity';
import { FarmaciasController } from './farmacias.controller';
import { FarmaciasService } from './farmacias.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacy, DutySchedule])],
  controllers: [FarmaciasController],
  providers: [FarmaciasService],
})
export class FarmaciasModule {}
