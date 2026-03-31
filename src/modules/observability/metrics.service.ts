import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Counter,
  Histogram,
  collectDefaultMetrics,
  register,
} from 'prom-client';
import { OpsEventSeverity } from './dto/ops-event.dto';

const HTTP_REQUESTS_TOTAL = 'ceres_api_http_requests_total';
const HTTP_REQUEST_DURATION_MS = 'ceres_api_http_request_duration_ms';
const OPS_EVENTS_TOTAL = 'ceres_api_ops_events_total';
const OPS_SLACK_NOTIFICATIONS_TOTAL = 'ceres_api_ops_slack_notifications_total';
const OPS_CENTRAL_EVENTS_TOTAL = 'ceres_api_ops_central_events_total';
const OPS_EMAIL_JOBS_TOTAL = 'ceres_api_ops_email_jobs_total';

type HttpRequestsTotalMetric = Counter<'method' | 'route' | 'status_code'>;
type HttpRequestDurationMetric = Histogram<'method' | 'route' | 'status_code'>;
type OpsEventsMetric = Counter<'source' | 'type' | 'severity' | 'result'>;
type OpsSlackMetric = Counter<'result'>;
type OpsCentralEventsMetric = Counter<'source' | 'kind' | 'status'>;
type OpsEmailJobsMetric = Counter<
  'source' | 'template' | 'result' | 'provider'
>;

type OpsEventResult =
  | 'accepted'
  | 'skipped_disabled'
  | 'skipped_severity'
  | 'throttled'
  | 'failed'
  | 'sent';

let defaultMetricsStarted = false;

@Injectable()
export class MetricsService {
  private readonly requestTotal: HttpRequestsTotalMetric;
  private readonly requestDurationMs: HttpRequestDurationMetric;
  private readonly opsEventsTotal: OpsEventsMetric;
  private readonly slackNotificationsTotal: OpsSlackMetric;
  private readonly centralEventsTotal: OpsCentralEventsMetric;
  private readonly emailJobsTotal: OpsEmailJobsMetric;

  constructor(private readonly config: ConfigService) {
    this.requestTotal =
      (register.getSingleMetric(
        HTTP_REQUESTS_TOTAL,
      ) as HttpRequestsTotalMetric) ||
      new Counter({
        name: HTTP_REQUESTS_TOTAL,
        help: 'Total de requests HTTP',
        labelNames: ['method', 'route', 'status_code'],
      });

    this.requestDurationMs =
      (register.getSingleMetric(
        HTTP_REQUEST_DURATION_MS,
      ) as HttpRequestDurationMetric) ||
      new Histogram({
        name: HTTP_REQUEST_DURATION_MS,
        help: 'Duracion de requests HTTP en milisegundos',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      });

    this.opsEventsTotal =
      (register.getSingleMetric(OPS_EVENTS_TOTAL) as OpsEventsMetric) ||
      new Counter({
        name: OPS_EVENTS_TOTAL,
        help: 'Eventos operativos recibidos/procesados por el backend',
        labelNames: ['source', 'type', 'severity', 'result'],
      });

    this.slackNotificationsTotal =
      (register.getSingleMetric(
        OPS_SLACK_NOTIFICATIONS_TOTAL,
      ) as OpsSlackMetric) ||
      new Counter({
        name: OPS_SLACK_NOTIFICATIONS_TOTAL,
        help: 'Intentos de envio de alertas a Slack',
        labelNames: ['result'],
      });

    this.centralEventsTotal =
      (register.getSingleMetric(
        OPS_CENTRAL_EVENTS_TOTAL,
      ) as OpsCentralEventsMetric) ||
      new Counter({
        name: OPS_CENTRAL_EVENTS_TOTAL,
        help: 'Eventos auditables centralizados por servicio',
        labelNames: ['source', 'kind', 'status'],
      });

    this.emailJobsTotal =
      (register.getSingleMetric(OPS_EMAIL_JOBS_TOTAL) as OpsEmailJobsMetric) ||
      new Counter({
        name: OPS_EMAIL_JOBS_TOTAL,
        help: 'Jobs de email procesados por el backend central',
        labelNames: ['source', 'template', 'result', 'provider'],
      });

    this.startDefaultMetrics();
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  getContentType(): string {
    return register.contentType;
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ): void {
    const labels = {
      method: method.toUpperCase(),
      route,
      status_code: String(statusCode),
    };

    this.requestTotal.inc(labels);
    this.requestDurationMs.observe(labels, durationMs);
  }

  recordOpsEvent(
    source: string,
    type: string,
    severity: OpsEventSeverity,
    result: OpsEventResult,
  ): void {
    this.opsEventsTotal.inc({
      source,
      type,
      severity,
      result,
    });
  }

  recordSlackNotification(result: 'sent' | 'failed' | 'throttled' | 'skipped') {
    this.slackNotificationsTotal.inc({ result });
  }

  recordCentralEvent(source: string, kind: string, status: string): void {
    this.centralEventsTotal.inc({ source, kind, status });
  }

  recordEmailJob(
    source: string,
    template: string,
    result: string,
    provider: string,
  ): void {
    this.emailJobsTotal.inc({ source, template, result, provider });
  }

  private startDefaultMetrics(): void {
    if (defaultMetricsStarted) return;

    const enabled = this.config.get<string>(
      'OBS_DEFAULT_METRICS_ENABLED',
      'true',
    );
    if (enabled.toLowerCase() !== 'true') return;

    const prefix = this.config.get<string>('OBS_METRICS_PREFIX', 'ceres_api_');
    collectDefaultMetrics({
      prefix,
      register,
    });
    defaultMetricsStarted = true;
  }
}
