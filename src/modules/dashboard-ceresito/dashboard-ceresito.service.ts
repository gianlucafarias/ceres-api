import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Contact } from '../../entities/contact.entity';
import { Converstation } from '../../entities/conversation.entity';
import { History } from '../../entities/history.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { RedisService } from '../../shared/redis/redis.service';
import { DashboardCeresitoSummaryQueryDto } from './dto/dashboard-ceresito-summary.dto';

const DEFAULT_TREATED_STATUS = 'ASIGNADO';
const DEFAULT_TIMEZONE = 'America/Argentina/Cordoba';
const DEFAULT_CACHE_TTL_SECONDS = 60;
const DEFAULT_RANGE_DAYS = 90;

type DashboardSummaryKpis = {
  uniqueUsers: number;
  conversations: number;
  messagesSent: number;
  claimsReceived: number;
  claimsTreated: number;
};

type DashboardSummaryData = {
  period: {
    from: string;
    to: string;
    timezone: string;
  };
  kpis: DashboardSummaryKpis;
  meta: {
    treatedStatus: string;
    generatedAt: string;
  };
};

export type DashboardCeresitoSummaryResponse = {
  success: true;
  data: DashboardSummaryData;
};

@Injectable()
export class DashboardCeresitoService {
  private readonly logger = new Logger(DashboardCeresitoService.name);

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Converstation)
    private readonly conversationRepo: Repository<Converstation>,
    @InjectRepository(History)
    private readonly historyRepo: Repository<History>,
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async getSummary(
    query: DashboardCeresitoSummaryQueryDto,
  ): Promise<DashboardCeresitoSummaryResponse> {
    const treatedStatus = query.treatedStatus ?? DEFAULT_TREATED_STATUS;
    const period = this.resolvePeriod(query.from, query.to);
    const cacheKey = this.buildCacheKey(period.from, period.to, treatedStatus);

    const cached = await this.getCachedSummary(cacheKey);
    if (cached) {
      return cached;
    }

    const range = Between(period.from, period.to);
    const [
      uniqueUsers,
      conversations,
      messagesSent,
      claimsReceived,
      claimsTreated,
    ] = await Promise.all([
      this.contactRepo.count({ where: { createdAt: range } }),
      this.conversationRepo.count({ where: { fecha_hora: range } }),
      this.historyRepo.count({ where: { createdAt: range } }),
      this.reclamoRepo.count({ where: { fecha: range } }),
      this.reclamoRepo.count({
        where: {
          fecha: range,
          estado: treatedStatus,
        },
      }),
    ]);

    const summary: DashboardCeresitoSummaryResponse = {
      success: true,
      data: {
        period: {
          from: period.from.toISOString(),
          to: period.to.toISOString(),
          timezone: DEFAULT_TIMEZONE,
        },
        kpis: {
          uniqueUsers,
          conversations,
          messagesSent,
          claimsReceived,
          claimsTreated,
        },
        meta: {
          treatedStatus,
          generatedAt: new Date().toISOString(),
        },
      },
    };

    await this.setCachedSummary(cacheKey, summary);
    return summary;
  }

  private resolvePeriod(from?: string, to?: string): { from: Date; to: Date } {
    const toDate = to ? new Date(to) : endOfDay(new Date());
    if (to) {
      toDate.setHours(23, 59, 59, 999);
    }

    const fromDate = from
      ? new Date(from)
      : startOfDay(addDays(toDate, -DEFAULT_RANGE_DAYS));

    if (fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException(
        '"from" must be less than or equal to "to".',
      );
    }

    return { from: fromDate, to: toDate };
  }

  private buildCacheKey(from: Date, to: Date, treatedStatus: string): string {
    return `dashboard:ceresito:summary:${from.toISOString()}:${to.toISOString()}:${treatedStatus}`;
  }

  private async getCachedSummary(
    cacheKey: string,
  ): Promise<DashboardCeresitoSummaryResponse | null> {
    try {
      const cachedRaw = await this.redis.get(cacheKey);
      if (!cachedRaw) return null;

      const parsed: unknown = JSON.parse(cachedRaw);
      if (!isDashboardSummaryResponse(parsed)) {
        return null;
      }

      return parsed;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Dashboard summary cache read failed: ${message}`);
      return null;
    }
  }

  private async setCachedSummary(
    cacheKey: string,
    summary: DashboardCeresitoSummaryResponse,
  ): Promise<void> {
    try {
      await this.redis.setEx(
        cacheKey,
        this.getCacheTtlSeconds(),
        JSON.stringify(summary),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Dashboard summary cache write failed: ${message}`);
    }
  }

  private getCacheTtlSeconds(): number {
    const raw = this.config.get<string>(
      'DASHBOARD_CERESITO_CACHE_TTL_SECONDS',
      String(DEFAULT_CACHE_TTL_SECONDS),
    );
    const parsed = Number.parseInt(raw, 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return DEFAULT_CACHE_TTL_SECONDS;
    }

    return parsed;
  }
}

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfDay(base: Date): Date {
  const date = new Date(base);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(base: Date): Date {
  const date = new Date(base);
  date.setHours(23, 59, 59, 999);
  return date;
}

function isDashboardSummaryResponse(
  value: unknown,
): value is DashboardCeresitoSummaryResponse {
  if (!isObject(value) || value.success !== true) return false;
  if (!isObject(value.data)) return false;
  if (!isObject(value.data.period)) return false;
  if (!isObject(value.data.kpis)) return false;
  if (!isObject(value.data.meta)) return false;

  const period = value.data.period;
  const kpis = value.data.kpis;
  const meta = value.data.meta;

  return (
    typeof period.from === 'string' &&
    typeof period.to === 'string' &&
    typeof period.timezone === 'string' &&
    typeof meta.treatedStatus === 'string' &&
    typeof meta.generatedAt === 'string' &&
    typeof kpis.uniqueUsers === 'number' &&
    typeof kpis.conversations === 'number' &&
    typeof kpis.messagesSent === 'number' &&
    typeof kpis.claimsReceived === 'number' &&
    typeof kpis.claimsTreated === 'number'
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
