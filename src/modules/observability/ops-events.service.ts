import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { randomUUID } from 'crypto';
import { OpsEventLog } from '../../entities/ops-event-log.entity';
import { RedisService } from '../../shared/redis/redis.service';
import { MetricsService } from './metrics.service';
import { IngestOpsEventDto } from './dto/ingest-ops-event.dto';
import {
  QueryOpsEventsDto,
  QueryOpsSummaryDto,
} from './dto/query-ops-events.dto';
import {
  ObsActorType,
  ObsEventKind,
  ObsEventStatus,
} from './observability.constants';
import {
  maskEmail,
  sanitizeForStorage,
  sanitizeText,
} from './observability-sanitize';

export type CentralActor = {
  type?: ObsActorType | null;
  id?: string | null;
  label?: string | null;
  email?: string | null;
  role?: string | null;
};

export type CreateCentralEventInput = {
  source: string;
  kind: ObsEventKind;
  domain: string;
  eventName: string;
  status: ObsEventStatus;
  summary: string;
  entityType?: string | null;
  entityId?: string | null;
  actor?: CentralActor | null;
  requestId?: string | null;
  route?: string | null;
  path?: string | null;
  method?: string | null;
  durationMs?: number | null;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date | string | null;
};

type OpsEventResponse = {
  id: string;
  source: string;
  kind: ObsEventKind;
  domain: string;
  eventName: string;
  entityType: string | null;
  entityId: string | null;
  actorType: ObsActorType;
  actorId: string | null;
  actorLabel: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  requestId: string | null;
  route: string | null;
  path: string | null;
  method: string | null;
  status: ObsEventStatus;
  durationMs: number | null;
  summary: string;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  occurredAt: string;
  ingestedAt: string;
};

@Injectable()
export class OpsEventsService {
  constructor(
    @InjectRepository(OpsEventLog)
    private readonly repo: Repository<OpsEventLog>,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {}

  async ingestExternalEvent(dto: IngestOpsEventDto): Promise<OpsEventResponse> {
    return this.createEvent({
      source: dto.source,
      kind: dto.kind,
      domain: dto.domain,
      eventName: dto.eventName,
      status: dto.status,
      summary: dto.summary,
      entityType: dto.entityType,
      entityId: dto.entityId,
      actor: {
        type: dto.actorType,
        id: dto.actorId,
        label: dto.actorLabel,
        email: dto.actorEmail,
        role: dto.actorRole,
      },
      requestId: dto.requestId,
      route: dto.route,
      path: dto.path,
      method: dto.method,
      durationMs: dto.durationMs,
      changes: dto.changes,
      metadata: dto.metadata,
      occurredAt: dto.occurredAt,
    });
  }

  async createEvent(input: CreateCentralEventInput): Promise<OpsEventResponse> {
    const entity = this.repo.create({
      id: randomUUID(),
      source: sanitizeToken(input.source, 64) ?? 'unknown',
      kind: sanitizeToken(input.kind, 16) ?? 'audit',
      domain: sanitizeToken(input.domain, 120) ?? 'unknown',
      eventName: sanitizeToken(input.eventName, 191) ?? 'event.unknown',
      entityType: sanitizeToken(input.entityType ?? null, 120),
      entityId: sanitizeText(input.entityId ?? null, 191),
      actorType: sanitizeToken(input.actor?.type ?? 'system', 32) ?? 'system',
      actorId: sanitizeText(input.actor?.id ?? null, 191),
      actorLabel: sanitizeText(input.actor?.label ?? null, 191),
      actorEmail: maskEmail(input.actor?.email ?? null),
      actorRole: sanitizeText(input.actor?.role ?? null, 120),
      requestId: sanitizeText(input.requestId ?? null, 191),
      route: sanitizeText(input.route ?? null, 255),
      path: sanitizeText(input.path ?? null, 255),
      method: sanitizeText(
        input.method ? input.method.toUpperCase() : null,
        16,
      ),
      status: sanitizeToken(input.status, 16) ?? 'success',
      durationMs:
        typeof input.durationMs === 'number' &&
        Number.isFinite(input.durationMs)
          ? Math.round(input.durationMs)
          : null,
      summary: sanitizeText(input.summary, 500) ?? 'Evento sin resumen',
      changes:
        input.changes && typeof input.changes === 'object'
          ? (sanitizeForStorage(input.changes) as Record<string, unknown>)
          : null,
      metadata:
        input.metadata && typeof input.metadata === 'object'
          ? (sanitizeForStorage(input.metadata) as Record<string, unknown>)
          : null,
      occurredAt: this.normalizeDate(input.occurredAt) ?? new Date(),
    });

    const saved = await this.repo.save(entity);
    this.metrics.recordCentralEvent(saved.source, saved.kind, saved.status);
    return this.toResponse(saved);
  }

  async listEvents(query: QueryOpsEventsDto) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
    const builder = this.buildListQuery(query);

    const total = await builder.getCount();
    const items = await builder
      .clone()
      .orderBy('event.occurredAt', 'DESC')
      .addOrderBy('event.ingestedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      success: true as const,
      data: items.map((item) => this.toResponse(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
      filters: {
        source: query.source ?? null,
        from: query.from ?? null,
        to: query.to ?? null,
        domain: query.domain ?? null,
        actorId: query.actorId ?? null,
        kind: query.kind ?? null,
        status: query.status ?? null,
        entityType: query.entityType ?? null,
        entityId: query.entityId ?? null,
        requestId: query.requestId ?? null,
        query: query.query ?? null,
      },
    };
  }

  async getEventDetail(id: string) {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) {
      return null;
    }

    const timeline = event.requestId
      ? await this.repo.find({
          where: {
            requestId: event.requestId,
            source: event.source,
          },
          order: {
            occurredAt: 'ASC',
            ingestedAt: 'ASC',
          },
          take: 100,
        })
      : [event];

    return {
      success: true as const,
      data: {
        event: this.toResponse(event),
        timeline: timeline.map((item) => this.toResponse(item)),
      },
    };
  }

  async getSummary(query: QueryOpsSummaryDto) {
    const source = sanitizeToken(query.source ?? null, 64);
    const cacheKey = `ops:summary:${source ?? 'all'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as {
          success: true;
          data: Record<string, unknown>;
        };
      } catch {
        // ignoramos cache corrupto
      }
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const totalEvents = await this.applySourceScope(
      this.repo.createQueryBuilder('event'),
      source,
    ).getCount();

    const events24h = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    ).getCount();

    const errorEvents24h = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    )
      .andWhere('event.status = :status', { status: 'failure' })
      .getCount();

    const adminActions24h = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    )
      .andWhere('event.kind = :kind', { kind: 'audit' })
      .andWhere('event.actorType = :actorType', { actorType: 'admin_user' })
      .getCount();

    const emailEvents24h = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    )
      .andWhere('event.domain LIKE :domain', { domain: '%email%' })
      .getCount();

    const requestFailures24h = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    )
      .andWhere('event.kind = :kind', { kind: 'request' })
      .andWhere('event.eventName = :eventName', {
        eventName: 'request.failed',
      })
      .getCount();

    const slowRequests24h = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    )
      .andWhere('event.kind = :kind', { kind: 'request' })
      .andWhere('event.eventName = :eventName', {
        eventName: 'request.slow',
      })
      .getCount();

    const statusBreakdown = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    )
      .select('event.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.status')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{ status: string; count: string }>();

    const domainBreakdown = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    )
      .select('event.domain', 'domain')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.domain')
      .orderBy('COUNT(*)', 'DESC')
      .limit(8)
      .getRawMany<{ domain: string; count: string }>();

    const recentFailures = await this.applySinceScope(
      this.applySourceScope(this.repo.createQueryBuilder('event'), source),
      since,
    )
      .andWhere('event.status IN (:...statuses)', {
        statuses: ['failure', 'warning'],
      })
      .orderBy('event.occurredAt', 'DESC')
      .addOrderBy('event.ingestedAt', 'DESC')
      .limit(6)
      .getMany();

    const payload = {
      success: true as const,
      data: {
        totals: {
          totalEvents,
          events24h,
          errorEvents24h,
          adminActions24h,
          emailEvents24h,
          requestFailures24h,
          slowRequests24h,
        },
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item.status,
          count: Number(item.count),
        })),
        domainBreakdown: domainBreakdown.map((item) => ({
          domain: item.domain,
          count: Number(item.count),
        })),
        recentFailures: recentFailures.map((item) => this.toResponse(item)),
      },
    };

    const ttlSeconds = this.getSummaryCacheTtl();
    if (ttlSeconds > 0) {
      await this.redis.setEx(cacheKey, ttlSeconds, JSON.stringify(payload));
    }

    return payload;
  }

  private buildListQuery(
    query: QueryOpsEventsDto,
  ): SelectQueryBuilder<OpsEventLog> {
    const builder = this.repo.createQueryBuilder('event');
    this.applySourceScope(builder, query.source ?? null);

    if (query.domain) {
      builder.andWhere('event.domain = :domain', { domain: query.domain });
    }
    if (query.actorId) {
      builder.andWhere('event.actorId = :actorId', { actorId: query.actorId });
    }
    if (query.kind) {
      builder.andWhere('event.kind = :kind', { kind: query.kind });
    }
    if (query.status) {
      builder.andWhere('event.status = :status', { status: query.status });
    }
    if (query.entityType) {
      builder.andWhere('event.entityType = :entityType', {
        entityType: query.entityType,
      });
    }
    if (query.entityId) {
      builder.andWhere('event.entityId = :entityId', {
        entityId: query.entityId,
      });
    }
    if (query.requestId) {
      builder.andWhere('event.requestId = :requestId', {
        requestId: query.requestId,
      });
    }

    const from = this.normalizeDate(query.from);
    const to = this.normalizeDate(query.to);
    if (from) {
      builder.andWhere('event.occurredAt >= :from', { from });
    }
    if (to) {
      builder.andWhere('event.occurredAt <= :to', { to });
    }

    if (query.query) {
      const search = `%${query.query}%`;
      builder.andWhere(
        new Brackets((where) => {
          where
            .where('event.requestId ILIKE :search', { search })
            .orWhere('event.entityId ILIKE :search', { search })
            .orWhere('event.summary ILIKE :search', { search })
            .orWhere('event.eventName ILIKE :search', { search })
            .orWhere('event.actorLabel ILIKE :search', { search });
        }),
      );
    }

    return builder;
  }

  private applySourceScope(
    builder: SelectQueryBuilder<OpsEventLog>,
    source?: string | null,
  ): SelectQueryBuilder<OpsEventLog> {
    if (source) {
      builder.andWhere('event.source = :source', { source });
    }
    return builder;
  }

  private applySinceScope(
    builder: SelectQueryBuilder<OpsEventLog>,
    since: Date,
  ): SelectQueryBuilder<OpsEventLog> {
    return builder.andWhere('event.occurredAt >= :since', { since });
  }

  private getSummaryCacheTtl(): number {
    const parsed = Number.parseInt(
      this.config.get<string>('OPS_SUMMARY_CACHE_TTL_SECONDS', '30'),
      10,
    );
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 30;
  }

  private normalizeDate(input?: string | Date | null): Date | null {
    if (!input) return null;
    const date = input instanceof Date ? input : new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toResponse(event: OpsEventLog): OpsEventResponse {
    return {
      id: event.id,
      source: event.source,
      kind: event.kind as ObsEventKind,
      domain: event.domain,
      eventName: event.eventName,
      entityType: event.entityType,
      entityId: event.entityId,
      actorType: event.actorType as ObsActorType,
      actorId: event.actorId,
      actorLabel: event.actorLabel,
      actorEmail: event.actorEmail,
      actorRole: event.actorRole,
      requestId: event.requestId,
      route: event.route,
      path: event.path,
      method: event.method,
      status: event.status as ObsEventStatus,
      durationMs: event.durationMs,
      summary: event.summary,
      changes:
        event.changes && typeof event.changes === 'object'
          ? event.changes
          : null,
      metadata:
        event.metadata && typeof event.metadata === 'object'
          ? event.metadata
          : null,
      createdAt: event.occurredAt.toISOString(),
      occurredAt: event.occurredAt.toISOString(),
      ingestedAt: event.ingestedAt.toISOString(),
    };
  }
}

function sanitizeToken(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  return sanitizeText(value, maxLength)?.toLowerCase() ?? null;
}
