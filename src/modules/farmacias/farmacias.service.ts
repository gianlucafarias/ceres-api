import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DutySchedule } from '../../entities/duty-schedule.entity';
import { Pharmacy } from '../../entities/pharmacy.entity';

const DEFAULT_CALENDAR_TIME_ZONE = 'America/Argentina/Buenos_Aires';

type DutyCalendarPreview = {
  today: { date: string; schedule: DutySchedule | null };
  tomorrow: { date: string; schedule: DutySchedule | null };
  dayAfterTomorrow: { date: string; schedule: DutySchedule | null };
};

@Injectable()
export class FarmaciasService {
  private bootstrapEtagRevision = 0;
  private readonly calendarTimeZone =
    process.env.FARMACIAS_CALENDAR_TIME_ZONE?.trim() ||
    DEFAULT_CALENDAR_TIME_ZONE;

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
    const today = this.getCurrentCalendarDateISO();
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
        scheduleYear: this.getYearFromISODate(date),
        source: 'manual-override',
      });
      const saved = await this.dutyRepo.save(row);
      this.invalidateBootstrapEtag();
      return saved;
    }

    existing.pharmacyCode = pharmacy.code;
    existing.pharmacy = pharmacy;
    existing.scheduleYear = this.getYearFromISODate(date);
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
    const todayISO = this.getCurrentCalendarDateISO();
    const tomorrowISO = this.addDaysToISODate(todayISO, 1);
    const dayAfterTomorrowISO = this.addDaysToISODate(todayISO, 2);

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

  getCurrentCalendarDateISO() {
    return this.toISODateOnlyInTimeZone(new Date(), this.calendarTimeZone);
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

  private addDaysToISODate(baseISODate: string, days: number) {
    const [year, month, day] = baseISODate.split('-').map(Number);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    ) {
      return baseISODate;
    }

    const nextUtc = new Date(Date.UTC(year, month - 1, day + days));
    return nextUtc.toISOString().slice(0, 10);
  }

  private toISODateOnlyInTimeZone(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const getPart = (type: 'year' | 'month' | 'day') =>
      parts.find((part) => part.type === type)?.value;

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }

    return date.toISOString().slice(0, 10);
  }

  private getYearFromISODate(date: string) {
    const year = Number.parseInt(date.slice(0, 4), 10);
    if (Number.isFinite(year)) return year;
    return new Date(date).getUTCFullYear();
  }
}
