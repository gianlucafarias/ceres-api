import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DutySchedule } from '../../entities/duty-schedule.entity';
import { Pharmacy } from '../../entities/pharmacy.entity';

type DutyCalendarPreview = {
  today: { date: string; schedule: DutySchedule | null };
  tomorrow: { date: string; schedule: DutySchedule | null };
  dayAfterTomorrow: { date: string; schedule: DutySchedule | null };
};

@Injectable()
export class FarmaciasService {
  private bootstrapEtagRevision = 0;

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
    const saved = await this.pharmacyRepo.save(pharmacy);
    this.invalidateBootstrapEtag();
    return saved;
  }

  async getDutyToday() {
    const today = this.toISODateOnly(new Date());
    return this.getDutyByDate(today);
  }

  async getDutyByDate(date: string) {
    const row = await this.dutyRepo.findOne({
      where: { date },
      relations: { pharmacy: true },
    });
    return row;
  }

  async getDutyRange(from: string, to: string) {
    return this.dutyRepo
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.pharmacy', 'pharmacy')
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
      const saved = await this.dutyRepo.save(row);
      this.invalidateBootstrapEtag();
      return saved;
    }

    existing.pharmacyCode = pharmacy.code;
    existing.pharmacy = pharmacy;
    existing.scheduleYear = new Date(date).getFullYear();
    existing.source = 'manual-override';
    const saved = await this.dutyRepo.save(existing);
    this.invalidateBootstrapEtag();
    return saved;
  }

  async getDutyByPharmacy(code: string, from: string, limit: number) {
    return this.dutyRepo
      .createQueryBuilder('ds')
      .leftJoinAndSelect('ds.pharmacy', 'pharmacy')
      .where('ds.pharmacy_code = :code', { code })
      .andWhere('ds.date >= :from', { from })
      .orderBy('ds.date', 'ASC')
      .limit(limit)
      .getMany();
  }

  async getBootstrap(from: string, to: string) {
    const [quickPreview, rows] = await Promise.all([
      this.getCalendar(),
      this.getDutyRange(from, to),
    ]);

    return {
      from,
      to,
      count: rows.length,
      quickPreview,
      rows,
      pharmacies: this.collectUniquePharmacies(rows, quickPreview),
    };
  }

  getBootstrapEtagSeed(from: string, to: string) {
    return `${from}:${to}:rev:${this.bootstrapEtagRevision}`;
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

    const [todaySchedule, tomorrowSchedule, dayAfterTomorrowSchedule] =
      await Promise.all([
        this.getDutyByDate(todayISO),
        this.getDutyByDate(tomorrowISO),
        this.getDutyByDate(dayAfterTomorrowISO),
      ]);

    return {
      today: todaySchedule
        ? { date: todayISO, schedule: todaySchedule }
        : { date: todayISO, schedule: null },
      tomorrow: tomorrowSchedule
        ? { date: tomorrowISO, schedule: tomorrowSchedule }
        : { date: tomorrowISO, schedule: null },
      dayAfterTomorrow: dayAfterTomorrowSchedule
        ? { date: dayAfterTomorrowISO, schedule: dayAfterTomorrowSchedule }
        : { date: dayAfterTomorrowISO, schedule: null },
    };
  }

  private invalidateBootstrapEtag() {
    this.bootstrapEtagRevision += 1;
  }

  private collectUniquePharmacies(
    rows: DutySchedule[],
    quickPreview: DutyCalendarPreview,
  ) {
    const byCode = new Map<string, Pharmacy>();
    const addSchedulePharmacy = (schedule: DutySchedule | null) => {
      if (schedule?.pharmacy) {
        byCode.set(schedule.pharmacy.code, schedule.pharmacy);
      }
    };

    for (const row of rows) {
      addSchedulePharmacy(row);
    }

    addSchedulePharmacy(quickPreview.today.schedule);
    addSchedulePharmacy(quickPreview.tomorrow.schedule);
    addSchedulePharmacy(quickPreview.dayAfterTomorrow.schedule);

    return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  }

  private toISODateOnly(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
