import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { OpsApiKeyGuard } from '../src/common/guards/ops-api-key.guard';
import { OpsEventsApiKeyGuard } from '../src/common/guards/ops-events-api-key.guard';
import { OpsMetricsController } from '../src/modules/observability/ops-metrics.controller';
import { MetricsService } from '../src/modules/observability/metrics.service';
import { OpsNotificationsController } from '../src/modules/observability/ops-notifications.controller';
import { OpsNotificationsService } from '../src/modules/observability/ops-notifications.service';

describe('Observability ops endpoints (e2e)', () => {
  let app: INestApplication<App>;
  const opsApiKey = 'ops-key-test';
  const eventsApiKey = 'events-key-test';
  const adminApiKey = 'admin-key-test';

  const metricsService = {
    getMetrics: jest.fn(),
    getContentType: jest.fn(),
  };
  const notificationsService = {
    ingestExternalEvent: jest.fn(),
  };

  beforeEach(async () => {
    metricsService.getMetrics.mockReset();
    metricsService.getContentType.mockReset();
    notificationsService.ingestExternalEvent.mockReset();

    metricsService.getMetrics.mockResolvedValue('# HELP mock');
    metricsService.getContentType.mockReturnValue('text/plain; version=0.0.4');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OpsMetricsController, OpsNotificationsController],
      providers: [
        OpsApiKeyGuard,
        OpsEventsApiKeyGuard,
        { provide: MetricsService, useValue: metricsService },
        { provide: OpsNotificationsService, useValue: notificationsService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              switch (key) {
                case 'OPS_API_KEY':
                  return opsApiKey;
                case 'OPS_EVENTS_API_KEYS':
                  return eventsApiKey;
                case 'ADMIN_API_KEY':
                  return adminApiKey;
                default:
                  return undefined;
              }
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidUnknownValues: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('protege metrics con api key de ops', async () => {
    await request(app.getHttpServer()).get('/api/v1/ops/metrics').expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/ops/metrics')
      .set('x-api-key', opsApiKey)
      .expect(200);

    expect(metricsService.getMetrics).toHaveBeenCalledTimes(1);
  });

  it('protege ingestion de eventos y acepta payload valido', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/ops/notifications/events')
      .send({ source: 'dashboard', type: 'legacy_fallback' })
      .expect(401);

    const response = await request(app.getHttpServer())
      .post('/api/v1/ops/notifications/events')
      .set('x-api-key', eventsApiKey)
      .send({
        source: 'dashboard',
        type: 'legacy_fallback',
        severity: 'warn',
        title: 'Fallback a legacy',
        message: 'Se activo fallback por timeout del core',
        metadata: { provider: 'legacy-core' },
      })
      .expect(202);

    expect(response.body).toEqual({ accepted: true });
    expect(notificationsService.ingestExternalEvent).toHaveBeenCalledTimes(1);
  });

  it('valida payload de eventos', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/ops/notifications/events')
      .set('x-api-key', eventsApiKey)
      .send({
        source: 'dashboard',
        type: 'legacy fallback con espacios',
      })
      .expect(400);

    expect(notificationsService.ingestExternalEvent).not.toHaveBeenCalled();
  });
});
