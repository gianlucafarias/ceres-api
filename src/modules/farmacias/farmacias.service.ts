import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DutySchedule } from '../../entities/duty-schedule.entity';
import { Pharmacy } from '../../entities/pharmacy.entity';

@Injectable()
export class FarmaciasService {
  constructor(
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepo: Repository<Pharmacy>,
    @InjectRepository(DutySchedule)
    private readonly dutyRepo: Repository<DutySchedule>,
  ) {}

  async getPharmacyByCode(code: string) {
    const pharmacy = await this.pharmacyRepo.findOne({ where: { code } });
    if (!pharmacy) {
      throw new NotFoundException(`Farmacia con codigo ${code} no encontrada`);
    }
    return pharmacy;
  }

  async updatePharmacy(code: string, updates: Partial<Pharmacy>) {
    const pharmacy = await this.pharmacyRepo.findOne({ where: { code } });
    if (!pharmacy) {
      throw new NotFoundException(`Farmacia con codigo ${code} no encontrada`);
    }

    Object.assign(pharmacy, updates);
    return this.pharmacyRepo.save(pharmacy);
  }

  async getDutyToday() {
    const today = this.toISODateOnly(new Date());
    return this.getDutyByDate(today);
  }

  async getDutyByDate(date: string) {
    const row = await this.dutyRepo.findOne({ where: { date } });
    return row;
  }

  async getDutyRange(from: string, to: string) {
    return this.dutyRepo
      .createQueryBuilder('ds')
      .where('ds.date >= :from AND ds.date <= :to', { from, to })
      .orderBy('ds.date', 'ASC')
      .getMany();
  }

  async updateDutyByDate(date: string, pharmacyCode: string) {
    const code = pharmacyCode.trim().toUpperCase();
    const pharmacy = await this.pharmacyRepo.findOne({ where: { code } });

    if (!pharmacy) {
      throw new NotFoundException(`Pharmacy with code ${code} not found`);
    }

    const existing = await this.getDutyByDate(date);
    if (!existing) {
      const row = this.dutyRepo.create({
        date,
        pharmacyCode: pharmacy.code,
        pharmacy,
        scheduleYear: new Date(date).getFullYear(),
        source: 'manual-override',
      });
      return this.dutyRepo.save(row);
    }

    existing.pharmacyCode = pharmacy.code;
    existing.pharmacy = pharmacy;
    existing.scheduleYear = new Date(date).getFullYear();
    existing.source = 'manual-override';
    return this.dutyRepo.save(existing);
  }

  async getDutyByPharmacy(code: string, from: string, limit: number) {
    return this.dutyRepo
      .createQueryBuilder('ds')
      .where('ds.pharmacy_code = :code', { code })
      .andWhere('ds.date >= :from', { from })
      .orderBy('ds.date', 'ASC')
      .limit(limit)
      .getMany();
  }

  async getCalendar() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const todayISO = this.toISODateOnly(today);
    const tomorrowISO = this.toISODateOnly(tomorrow);
    const dayAfterTomorrowISO = this.toISODateOnly(dayAfterTomorrow);

    const [todaySchedule, tomorrowSchedule, dayAfterTomorrowSchedule] = await Promise.all([
      this.getDutyByDate(todayISO),
      this.getDutyByDate(tomorrowISO),
      this.getDutyByDate(dayAfterTomorrowISO),
    ]);

    return {
      today: todaySchedule ? { date: todayISO, schedule: todaySchedule } : { date: todayISO, schedule: null },
      tomorrow: tomorrowSchedule
        ? { date: tomorrowISO, schedule: tomorrowSchedule }
        : { date: tomorrowISO, schedule: null },
      dayAfterTomorrow: dayAfterTomorrowSchedule
        ? { date: dayAfterTomorrowISO, schedule: dayAfterTomorrowSchedule }
        : { date: dayAfterTomorrowISO, schedule: null },
    };
  }

  private toISODateOnly(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
