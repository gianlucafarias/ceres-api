import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminApiKeyGuard } from '../src/common/guards/admin-api-key.guard';
import { DashboardCeresitoController } from '../src/modules/dashboard-ceresito/dashboard-ceresito.controller';
import { DashboardCeresitoService } from '../src/modules/dashboard-ceresito/dashboard-ceresito.service';

describe('Dashboard Ceresito summary (e2e)', () => {
  let app: INestApplication<App>;
  const adminApiKey = 'admin-key-test';
  const service = {
    getSummary: jest.fn(),
  };

  beforeEach(async () => {
    service.getSummary.mockReset();
    service.getSummary.mockResolvedValue({
      success: true,
      data: {
        period: {
          from: '2026-02-01T00:00:00.000Z',
          to: '2026-02-09T23:59:59.999Z',
          timezone: 'America/Argentina/Cordoba',
        },
        kpis: {
          uniqueUsers: 1,
          conversations: 2,
          messagesSent: 3,
          claimsReceived: 4,
          claimsTreated: 5,
        },
        meta: {
          treatedStatus: 'ASIGNADO',
          generatedAt: '2026-02-09T14:00:00.000Z',
        },
      },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DashboardCeresitoController],
      providers: [
        AdminApiKeyGuard,
        { provide: DashboardCeresitoService, useValue: service },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'ADMIN_API_KEY' ? adminApiKey : undefined,
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

  it('requiere ADMIN_API_KEY', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/ceresito/summary')
      .expect(401);
  });

  it('valida fechas y retorna 400 en query invalida', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/ceresito/summary?from=no-es-fecha')
      .set('x-api-key', adminApiKey)
      .expect(400);

    expect(service.getSummary).not.toHaveBeenCalled();
  });

  it('responde summary cuando la query es valida', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard/ceresito/summary?from=2026-02-01&to=2026-02-09')
      .set('x-api-key', adminApiKey)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data.kpis.uniqueUsers', 1);
    expect(response.body).toHaveProperty('data.kpis.conversations', 2);
    expect(response.body).toHaveProperty('data.kpis.messagesSent', 3);
    expect(response.body).toHaveProperty('data.kpis.claimsReceived', 4);
    expect(response.body).toHaveProperty('data.kpis.claimsTreated', 5);
    expect(service.getSummary).toHaveBeenCalledTimes(1);
  });
});
