import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { HttpClient } from '../../shared/http/http-client.service';
import { RedisService } from '../../shared/redis/redis.service';
import { OpsEventDto, OpsEventSeverity } from './dto/ops-event.dto';
import { MetricsService } from './metrics.service';

const SENSITIVE_KEYS = [
  'phone',
  'telefono',
  'dni',
  'email',
  'token',
  'password',
  'authorization',
  'api_key',
  'apikey',
  'secret',
] as const;

const severityRank: Record<OpsEventSeverity, number> = {
  info: 10,
  warn: 20,
  error: 30,
  critical: 40,
};

type NotificationContext = {
  requestId?: string;
  clientIp?: string;
};

type NormalizedOpsEvent = {
  source: string;
  type: string;
  severity: OpsEventSeverity;
  title: string;
  message: string;
  fingerprint: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class OpsNotificationsService {
  private readonly logger = new Logger(OpsNotificationsService.name);
  private readonly memoryThrottle = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly http: HttpClient,
    private readonly metrics: MetricsService,
  ) {}

  ingestExternalEvent(event: OpsEventDto, context?: NotificationContext): void {
    const normalized = this.normalizeEvent(event);
    this.metrics.recordOpsEvent(
      normalized.source,
      normalized.type,
      normalized.severity,
      'accepted',
    );

    setImmediate(() => {
      void this.processEvent(normalized, context);
    });
  }

  emitInternalEvent(
    event: Omit<OpsEventDto, 'source'> & { source?: string },
    context?: NotificationContext,
  ): void {
    this.ingestExternalEvent(
      {
        ...event,
        source: event.source ?? 'backend',
      },
      context,
    );
  }

  private async processEvent(
    event: NormalizedOpsEvent,
    context?: NotificationContext,
  ): Promise<void> {
    if (!this.isAlertingEnabled()) {
      this.metrics.recordOpsEvent(
        event.source,
        event.type,
        event.severity,
        'skipped_disabled',
      );
      this.metrics.recordSlackNotification('skipped');
      return;
    }

    const minSeverity = this.getMinSeverity();
    if (severityRank[event.severity] < severityRank[minSeverity]) {
      this.metrics.recordOpsEvent(
        event.source,
        event.type,
        event.severity,
        'skipped_severity',
      );
      this.metrics.recordSlackNotification('skipped');
      return;
    }

    const throttleSeconds = this.getThrottleSeconds();
    const throttled = await this.isThrottled(
      event.fingerprint,
      throttleSeconds,
    );
    if (throttled) {
      this.metrics.recordOpsEvent(
        event.source,
        event.type,
        event.severity,
        'throttled',
      );
      this.metrics.recordSlackNotification('throttled');
      return;
    }

    try {
      await this.sendSlack(event, context);
      this.metrics.recordOpsEvent(
        event.source,
        event.type,
        event.severity,
        'sent',
      );
      this.metrics.recordSlackNotification('sent');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Slack notification failed: ${message}`);
      this.metrics.recordOpsEvent(
        event.source,
        event.type,
        event.severity,
        'failed',
      );
      this.metrics.recordSlackNotification('failed');
    }
  }

  private async sendSlack(
    event: NormalizedOpsEvent,
    context?: NotificationContext,
  ): Promise<void> {
    const webhookUrl = this.config.get<string>('OPS_SLACK_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('OPS_SLACK_WEBHOOK_URL is not configured');
    }

    const payload = {
      text: this.buildSlackText(event, context),
    };

    await this.http.post<unknown, typeof payload>(webhookUrl, payload, {
      timeout: this.getSlackTimeoutMs(),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private buildSlackText(
    event: NormalizedOpsEvent,
    context?: NotificationContext,
  ): string {
    const environment = this.config.get<string>('NODE_ENV', 'development');
    const chunks = [
      `*${event.severity.toUpperCase()}* \`${event.source}.${event.type}\``,
      `*Titulo:* ${event.title}`,
      `*Mensaje:* ${event.message}`,
      `*Ambiente:* ${environment}`,
      `*Cuando:* ${event.occurredAt}`,
      `*Fingerprint:* \`${event.fingerprint}\``,
    ];

    if (context?.requestId) {
      chunks.push(`*Request ID:* \`${context.requestId}\``);
    }
    if (context?.clientIp) {
      chunks.push(`*IP:* \`${context.clientIp}\``);
    }

    const metadataText = this.stringifyMetadata(event.metadata);
    if (metadataText) {
      chunks.push(`*Metadata:* \`\`\`${metadataText}\`\`\``);
    }

    return chunks.join('\n');
  }

  private stringifyMetadata(metadata?: Record<string, unknown>): string | null {
    if (!metadata) return null;

    const sanitized = sanitizeMetadata(metadata);
    const serialized = JSON.stringify(sanitized);
    if (!serialized) return null;

    return serialized.slice(0, 1200);
  }

  private normalizeEvent(event: OpsEventDto): NormalizedOpsEvent {
    const severity = event.severity ?? 'error';
    const title = sanitizeText(event.title ?? event.type);
    const message = sanitizeText(event.message ?? 'Evento sin detalle');
    const occurredAt = event.occurredAt ?? new Date().toISOString();
    const fingerprint = event.fingerprint
      ? sanitizeText(event.fingerprint, 120)
      : this.createFingerprint(event.source, event.type, severity, message);

    return {
      source: sanitizeToken(event.source, 32),
      type: sanitizeToken(event.type, 64),
      severity,
      title,
      message,
      fingerprint,
      occurredAt,
      metadata: event.metadata,
    };
  }

  private createFingerprint(
    source: string,
    type: string,
    severity: OpsEventSeverity,
    message: string,
  ): string {
    const raw = `${source}:${type}:${severity}:${message.toLowerCase()}`;
    return createHash('sha1').update(raw).digest('hex').slice(0, 32);
  }

  private isAlertingEnabled(): boolean {
    return (
      this.config
        .get<string>('OPS_ALERTS_ENABLED', 'false')
        .trim()
        .toLowerCase() === 'true'
    );
  }

  private getMinSeverity(): OpsEventSeverity {
    const raw = this.config
      .get<string>('OPS_ALERT_MIN_SEVERITY', 'error')
      .trim()
      .toLowerCase();

    if (
      raw === 'info' ||
      raw === 'warn' ||
      raw === 'error' ||
      raw === 'critical'
    ) {
      return raw;
    }

    return 'error';
  }

  private getSlackTimeoutMs(): number {
    const raw = this.config.get<string>('OPS_ALERT_TIMEOUT_MS', '3000');
    const parsed = Number.parseInt(raw, 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
  }

  private getThrottleSeconds(): number {
    const raw = this.config.get<string>('OPS_ALERT_THROTTLE_SECONDS', '300');
    const parsed = Number.parseInt(raw, 10);

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 300;
  }

  private async isThrottled(
    fingerprint: string,
    throttleSeconds: number,
  ): Promise<boolean> {
    if (throttleSeconds <= 0) return false;

    const key = `ops:alerts:throttle:${fingerprint}`;
    if (this.redis.isEnabled()) {
      try {
        const existing = await this.redis.get(key);
        if (existing) return true;

        await this.redis.setEx(key, throttleSeconds, '1');
        return false;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Redis throttle fallback to memory: ${message}`);
      }
    }

    return this.isThrottledInMemory(key, throttleSeconds);
  }

  private isThrottledInMemory(key: string, throttleSeconds: number): boolean {
    const now = Date.now();
    const expiresAt = this.memoryThrottle.get(key);
    if (expiresAt && expiresAt > now) {
      return true;
    }

    this.memoryThrottle.set(key, now + throttleSeconds * 1000);
    this.compactMemoryThrottle(now);
    return false;
  }

  private compactMemoryThrottle(now: number): void {
    if (this.memoryThrottle.size < 1000) return;

    for (const [key, expiresAt] of this.memoryThrottle.entries()) {
      if (expiresAt <= now) {
        this.memoryThrottle.delete(key);
      }
    }
  }
}

function sanitizeText(value: string, maxLength = 400): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeToken(value: string, maxLength: number): string {
  return sanitizeText(value, maxLength).toLowerCase();
}

function sanitizeMetadata(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (isSensitiveKey(key)) {
      result[key] = '[redacted]';
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = (value as unknown[]).map((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          return sanitizeMetadata(item as Record<string, unknown>);
        }
        return item;
      });
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeMetadata(value as Record<string, unknown>);
      continue;
    }

    result[key] = value;
  }

  return result;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((token) => normalized.includes(token));
}
