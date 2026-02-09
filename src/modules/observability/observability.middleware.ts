import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';
import { OpsNotificationsService } from './ops-notifications.service';

@Injectable()
export class ObservabilityMiddleware implements NestMiddleware {
  private readonly sampleRate: number;
  private readonly log5xx: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
    private readonly notifications: OpsNotificationsService,
  ) {
    this.sampleRate = parseSampleRate(
      this.config.get<string>('OBS_REQUEST_LOG_SAMPLE_RATE', '0'),
    );
    this.log5xx = this.config
      .get<string>('OBS_REQUEST_LOG_5XX_ENABLED', 'true')
      .trim()
      .toLowerCase()
      .startsWith('t');
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    const requestId = this.ensureRequestId(request, response);

    response.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const route = resolveRouteLabel(request);
      const statusCode = response.statusCode;

      this.metrics.recordHttpRequest(
        request.method,
        route,
        statusCode,
        Math.max(durationMs, 0),
      );

      if (statusCode >= 500) {
        this.notifications.emitInternalEvent(
          {
            source: 'backend',
            type: 'http_5xx',
            severity: 'error',
            title: 'HTTP 5xx response',
            message: `${request.method} ${request.originalUrl ?? request.url} -> ${statusCode}`,
            fingerprint: `${request.method.toUpperCase()}:${route}:${statusCode}`,
            metadata: {
              method: request.method,
              route,
              url: request.originalUrl ?? request.url,
              statusCode,
              durationMs: Number(durationMs.toFixed(2)),
            },
          },
          {
            requestId,
            clientIp: request.ip,
          },
        );
      }

      if (this.shouldLog(statusCode)) {
        logRequest({
          requestId,
          method: request.method,
          path: request.originalUrl ?? request.url,
          route,
          statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }
    });

    next();
  }

  private shouldLog(statusCode: number): boolean {
    if (statusCode >= 500) return this.log5xx;
    if (this.sampleRate <= 0) return false;

    return Math.random() < this.sampleRate;
  }

  private ensureRequestId(request: Request, response: Response): string {
    const requestId =
      getHeaderValue(request.headers['x-request-id']) ?? randomUUID();
    response.setHeader('x-request-id', requestId);
    return requestId;
  }
}

function resolveRouteLabel(request: Request): string {
  const routeCandidate: unknown = request.route;
  const routePath =
    typeof routeCandidate === 'object' &&
    routeCandidate !== null &&
    'path' in routeCandidate
      ? (routeCandidate as { path?: unknown }).path
      : undefined;

  if (typeof routePath === 'string') {
    return `${request.baseUrl}${routePath}` || '/';
  }

  return '__unmatched__';
}

function getHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function parseSampleRate(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

function logRequest(event: {
  requestId: string;
  method: string;
  path: string;
  route: string;
  statusCode: number;
  durationMs: number;
  ip?: string;
  userAgent?: string | string[];
}): void {
  const level = event.statusCode >= 500 ? 'error' : 'info';
  const payload = {
    level,
    msg: 'http_request',
    ...event,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(payload));
}
