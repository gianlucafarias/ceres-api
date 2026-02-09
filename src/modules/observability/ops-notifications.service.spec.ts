import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { HttpClient } from '../../shared/http/http-client.service';
import { RedisService } from '../../shared/redis/redis.service';
import { MetricsService } from './metrics.service';
import { OpsNotificationsService } from './ops-notifications.service';

describe('OpsNotificationsService', () => {
  let service: OpsNotificationsService;
  let httpClient: {
    post: jest.MockedFunction<
      <TResponse, TBody = unknown>(
        url: string,
        body?: TBody,
        config?: {
          headers?: Record<string, string>;
          params?: Record<string, unknown>;
          timeout?: number;
        },
      ) => Promise<TResponse>
    >;
  };
  let metrics: {
    recordOpsEvent: jest.MockedFunction<
      (
        source: string,
        type: string,
        severity: 'info' | 'warn' | 'error' | 'critical',
        result:
          | 'accepted'
          | 'skipped_disabled'
          | 'skipped_severity'
          | 'throttled'
          | 'failed'
          | 'sent',
      ) => void
    >;
    recordSlackNotification: jest.MockedFunction<
      (result: 'sent' | 'failed' | 'throttled' | 'skipped') => void
    >;
  };
  let redis: {
    isEnabled: jest.MockedFunction<() => boolean>;
    get: jest.MockedFunction<(key: string) => Promise<string | null>>;
    setEx: jest.MockedFunction<
      (key: string, ttlSeconds: number, value: string) => Promise<void>
    >;
  };
  let configValues: Record<string, string>;

  beforeEach(async () => {
    configValues = {
      OPS_ALERTS_ENABLED: 'false',
      OPS_ALERT_MIN_SEVERITY: 'error',
      OPS_ALERT_THROTTLE_SECONDS: '300',
      OPS_ALERT_TIMEOUT_MS: '3000',
      NODE_ENV: 'test',
    };

    httpClient = {
      post: jest.fn(),
    };
    metrics = {
      recordOpsEvent: jest.fn(),
      recordSlackNotification: jest.fn(),
    };
    redis = {
      isEnabled: jest.fn(() => false),
      get: jest.fn(),
      setEx: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        OpsNotificationsService,
        { provide: HttpClient, useValue: httpClient },
        { provide: MetricsService, useValue: metrics },
        { provide: RedisService, useValue: redis },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              configValues[key] ?? fallback,
          },
        },
      ],
    }).compile();

    service = module.get(OpsNotificationsService);
  });

  it('no envia a Slack cuando alertas estan deshabilitadas', async () => {
    service.ingestExternalEvent({
      source: 'dashboard',
      type: 'legacy_fallback',
      severity: 'warn',
      message: 'Fallback activado',
    });

    await waitAsyncJobs();

    expect(httpClient.post).not.toHaveBeenCalled();
    expect(metrics.recordOpsEvent).toHaveBeenCalledWith(
      'dashboard',
      'legacy_fallback',
      'warn',
      'accepted',
    );
    expect(metrics.recordSlackNotification).toHaveBeenCalledWith('skipped');
  });

  it('envia a Slack cuando esta habilitado y supera severidad minima', async () => {
    configValues.OPS_ALERTS_ENABLED = 'true';
    configValues.OPS_ALERT_MIN_SEVERITY = 'warn';
    configValues.OPS_ALERT_THROTTLE_SECONDS = '0';
    configValues.OPS_SLACK_WEBHOOK_URL = 'https://hooks.slack.test/abc';
    httpClient.post.mockResolvedValue({});

    service.ingestExternalEvent({
      source: 'bot',
      type: 'provider_failure',
      severity: 'error',
      title: 'Proveedor caido',
      message: 'No responde API externa',
    });

    await waitAsyncJobs();

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(metrics.recordSlackNotification).toHaveBeenCalledWith('sent');
  });

  it('usa webhook legacy SLACK_WEBHOOK_URL cuando OPS_SLACK_WEBHOOK_URL no existe', async () => {
    configValues.OPS_ALERTS_ENABLED = 'true';
    configValues.OPS_ALERT_MIN_SEVERITY = 'warn';
    configValues.OPS_ALERT_THROTTLE_SECONDS = '0';
    configValues.OPS_SLACK_WEBHOOK_URL = '';
    configValues.SLACK_WEBHOOK_URL = 'https://hooks.slack.test/legacy';
    httpClient.post.mockResolvedValue({});

    service.ingestExternalEvent({
      source: 'dashboard',
      type: 'legacy_fallback',
      severity: 'error',
      message: 'Fallback activado',
    });

    await waitAsyncJobs();

    expect(httpClient.post).toHaveBeenCalledWith(
      'https://hooks.slack.test/legacy',
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('aplica throttle en memoria para eventos repetidos', async () => {
    configValues.OPS_ALERTS_ENABLED = 'true';
    configValues.OPS_ALERT_MIN_SEVERITY = 'warn';
    configValues.OPS_ALERT_THROTTLE_SECONDS = '120';
    configValues.OPS_SLACK_WEBHOOK_URL = 'https://hooks.slack.test/abc';
    httpClient.post.mockResolvedValue({});

    const repeatedEvent = {
      source: 'services',
      type: 'job_failure',
      severity: 'error' as const,
      message: 'Fallo en job nocturno',
      fingerprint: 'job-nightly',
    };

    service.ingestExternalEvent(repeatedEvent);
    await waitAsyncJobs();

    service.ingestExternalEvent(repeatedEvent);
    await waitAsyncJobs();

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(metrics.recordSlackNotification).toHaveBeenCalledWith('throttled');
  });
});

async function waitAsyncJobs(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
}
