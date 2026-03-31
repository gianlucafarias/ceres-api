import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '../../shared/redis/redis.service';
import { EnqueueEmailJobDto } from './dto/enqueue-email-job.dto';
import { MetricsService } from './metrics.service';
import { prepareEmailTemplate } from './ops-email.templates';
import { EmailSkipError, OpsEmailService } from './ops-email.service';
import { OpsEventsService } from './ops-events.service';
import { EmailJobActor, StoredEmailJob } from './ops-email.types';
import { maskEmail, sanitizeForStorage } from './observability-sanitize';

const QUEUE_PENDING_KEY = 'ops:email:pending';
const QUEUE_PROCESSING_KEY = 'ops:email:processing';
const QUEUE_DEAD_LETTER_KEY = 'ops:email:dead_letter';

@Injectable()
export class OpsEmailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OpsEmailQueueService.name);
  private readonly memoryIdempotency = new Map<string, number>();
  private timer: NodeJS.Timeout | null = null;
  private draining = false;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly emailService: OpsEmailService,
    private readonly eventsService: OpsEventsService,
    private readonly metrics: MetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.redis.isEnabled()) {
      await this.restoreInFlightJobs();
      this.timer = setInterval(() => {
        void this.drainOnce();
      }, this.getPollIntervalMs());
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async enqueue(dto: EnqueueEmailJobDto) {
    const prepared = prepareEmailTemplate(dto.templateKey, {
      entityId: dto.entityId,
      recipient: dto.recipient,
      payload: dto.payload,
    });
    const job: StoredEmailJob = {
      id: randomUUID(),
      source: dto.source.trim().toLowerCase(),
      templateKey: dto.templateKey,
      recipient: dto.recipient.trim(),
      payload: dto.payload,
      idempotencyKey: dto.idempotencyKey.trim(),
      requestId: dto.requestId?.trim() || null,
      entityType: dto.entityType?.trim() || null,
      entityId: dto.entityId?.trim() || null,
      actor: normalizeActor(dto.actor),
      metadata:
        dto.metadata && typeof dto.metadata === 'object'
          ? (sanitizeForStorage(dto.metadata) as Record<string, unknown>)
          : null,
      providerStrategy: dto.providerStrategy ?? 'resend-first',
      attempts: 0,
      createdAt: new Date().toISOString(),
      summary: prepared.summary,
      domain: prepared.domain,
    };

    const reserved = await this.reserveIdempotency(job.idempotencyKey);
    if (!reserved) {
      await this.eventsService.createEvent({
        source: job.source,
        kind: 'workflow',
        domain: job.domain,
        eventName: `${job.templateKey}.skipped`,
        status: 'skipped',
        summary: `${job.summary} (duplicate_idempotency_key)`,
        actor: job.actor,
        requestId: job.requestId,
        entityType: job.entityType,
        entityId: job.entityId,
        metadata: {
          templateKey: job.templateKey,
          recipient: maskEmail(job.recipient),
          reason: 'duplicate_idempotency_key',
        },
      });
      this.metrics.recordEmailJob(job.source, job.templateKey, 'skipped', 'queue');
      return {
        accepted: true,
        duplicate: true,
        queued: false,
        jobId: job.id,
      };
    }

    await this.eventsService.createEvent({
      source: job.source,
      kind: 'workflow',
      domain: job.domain,
      eventName: `${job.templateKey}.requested`,
      status: 'success',
      summary: job.summary,
      actor: job.actor,
      requestId: job.requestId,
      entityType: job.entityType,
      entityId: job.entityId,
      metadata: {
        templateKey: job.templateKey,
        recipient: maskEmail(job.recipient),
        providerStrategy: job.providerStrategy,
        queueMode: this.redis.isEnabled() ? 'redis' : 'in_memory',
        ...(job.metadata ?? {}),
      },
    });
    this.metrics.recordEmailJob(job.source, job.templateKey, 'requested', 'queue');

    if (this.redis.isEnabled()) {
      await this.redis.lPush(QUEUE_PENDING_KEY, JSON.stringify(job));
      return {
        accepted: true,
        duplicate: false,
        queued: true,
        jobId: job.id,
      };
    }

    setImmediate(() => {
      void this.processJob(job);
    });

    return {
      accepted: true,
      duplicate: false,
      queued: false,
      jobId: job.id,
    };
  }

  private async restoreInFlightJobs(): Promise<void> {
    const processingJobs = await this.redis.lRange(QUEUE_PROCESSING_KEY, 0, -1);
    if (processingJobs.length === 0) {
      return;
    }

    for (const rawJob of processingJobs.reverse()) {
      await this.redis.lPush(QUEUE_PENDING_KEY, rawJob);
    }
    await this.redis.del(QUEUE_PROCESSING_KEY);
  }

  private async drainOnce(): Promise<void> {
    if (this.draining || !this.redis.isEnabled()) {
      return;
    }

    this.draining = true;
    try {
      const rawJob = await this.redis.rPopLPush(
        QUEUE_PENDING_KEY,
        QUEUE_PROCESSING_KEY,
      );
      if (!rawJob) {
        return;
      }

      let job: StoredEmailJob;
      try {
        job = JSON.parse(rawJob) as StoredEmailJob;
      } catch (error) {
        this.logger.error(`Email job corrupto descartado: ${String(error)}`);
        await this.redis.lRem(QUEUE_PROCESSING_KEY, 1, rawJob);
        return;
      }

      await this.processJob(job, rawJob);
    } finally {
      this.draining = false;
    }
  }

  private async processJob(job: StoredEmailJob, rawJob?: string): Promise<void> {
    const prepared = prepareEmailTemplate(job.templateKey, {
      entityId: job.entityId,
      recipient: job.recipient,
      payload: job.payload,
    });

    try {
      const result = await this.emailService.send(job, prepared);
      await this.eventsService.createEvent({
        source: job.source,
        kind: 'workflow',
        domain: job.domain,
        eventName: `${job.templateKey}.sent`,
        status: 'success',
        summary: job.summary,
        actor: job.actor,
        requestId: job.requestId,
        entityType: job.entityType,
        entityId: job.entityId,
        metadata: {
          templateKey: job.templateKey,
          recipient: maskEmail(job.recipient),
          provider: result.provider,
          messageId: result.messageId,
          attempts: job.attempts + 1,
        },
      });
      this.metrics.recordEmailJob(
        job.source,
        job.templateKey,
        'sent',
        result.provider,
      );

      if (rawJob && this.redis.isEnabled()) {
        await this.redis.lRem(QUEUE_PROCESSING_KEY, 1, rawJob);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const metadata = {
        templateKey: job.templateKey,
        recipient: maskEmail(job.recipient),
        attempts: job.attempts + 1,
        error: message,
      };

      if (error instanceof EmailSkipError) {
        await this.eventsService.createEvent({
          source: job.source,
          kind: 'workflow',
          domain: job.domain,
          eventName: `${job.templateKey}.skipped`,
          status: 'skipped',
          summary: `${job.summary} (${error.reason})`,
          actor: job.actor,
          requestId: job.requestId,
          entityType: job.entityType,
          entityId: job.entityId,
          metadata: {
            ...metadata,
            reason: error.reason,
          },
        });
        this.metrics.recordEmailJob(job.source, job.templateKey, 'skipped', 'none');

        if (rawJob && this.redis.isEnabled()) {
          await this.redis.lRem(QUEUE_PROCESSING_KEY, 1, rawJob);
        }
        return;
      }

      const nextAttempts = job.attempts + 1;
      const willRetry = nextAttempts < this.getMaxAttempts();

      await this.eventsService.createEvent({
        source: job.source,
        kind: 'workflow',
        domain: job.domain,
        eventName: `${job.templateKey}.failed`,
        status: 'failure',
        summary: job.summary,
        actor: job.actor,
        requestId: job.requestId,
        entityType: job.entityType,
        entityId: job.entityId,
        metadata: {
          ...metadata,
          willRetry,
        },
      });
      this.metrics.recordEmailJob(job.source, job.templateKey, 'failed', 'queue');

      if (rawJob && this.redis.isEnabled()) {
        await this.redis.lRem(QUEUE_PROCESSING_KEY, 1, rawJob);

        if (willRetry) {
          await this.redis.lPush(
            QUEUE_PENDING_KEY,
            JSON.stringify({
              ...job,
              attempts: nextAttempts,
            } satisfies StoredEmailJob),
          );
        } else {
          await this.redis.lPush(
            QUEUE_DEAD_LETTER_KEY,
            JSON.stringify({
              ...job,
              attempts: nextAttempts,
            } satisfies StoredEmailJob),
          );
        }
      }
    }
  }

  private async reserveIdempotency(key: string): Promise<boolean> {
    const ttlSeconds = this.getIdempotencyTtlSeconds();
    const now = Date.now();

    if (this.redis.isEnabled()) {
      return this.redis.setNxEx(`ops:email:idempotency:${key}`, ttlSeconds, '1');
    }

    const existing = this.memoryIdempotency.get(key);
    if (existing && existing > now) {
      return false;
    }

    this.memoryIdempotency.set(key, now + ttlSeconds * 1000);
    this.compactMemoryIdempotency(now);
    return true;
  }

  private compactMemoryIdempotency(now: number): void {
    if (this.memoryIdempotency.size < 1000) {
      return;
    }

    for (const [key, expiresAt] of this.memoryIdempotency.entries()) {
      if (expiresAt <= now) {
        this.memoryIdempotency.delete(key);
      }
    }
  }

  private getIdempotencyTtlSeconds(): number {
    const parsed = Number.parseInt(
      this.config.get<string>('OPS_EMAIL_IDEMPOTENCY_TTL_SECONDS', '86400'),
      10,
    );
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 86400;
  }

  private getPollIntervalMs(): number {
    const parsed = Number.parseInt(
      this.config.get<string>('OPS_EMAIL_QUEUE_POLL_MS', '1000'),
      10,
    );
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
  }

  private getMaxAttempts(): number {
    const parsed = Number.parseInt(
      this.config.get<string>('OPS_EMAIL_MAX_ATTEMPTS', '3'),
      10,
    );
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
  }
}

function normalizeActor(actor?: EmailJobActor | null): EmailJobActor | null {
  if (!actor) {
    return null;
  }

  return {
    type: actor.type ?? null,
    id: actor.id?.trim() || null,
    label: actor.label?.trim() || null,
    email: actor.email?.trim() || null,
    role: actor.role?.trim() || null,
  };
}
