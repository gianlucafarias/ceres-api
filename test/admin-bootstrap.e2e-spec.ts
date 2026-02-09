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
import { AdminBootstrapController } from '../src/modules/admin-bootstrap/admin-bootstrap.controller';
import { AdminBootstrapService } from '../src/modules/admin-bootstrap/admin-bootstrap.service';

describe('Admin bootstrap (e2e)', () => {
  let app: INestApplication<App>;
  const adminApiKey = 'admin-key-test';
  const service = {
    getBootstrap: jest.fn(),
  };

  beforeEach(async () => {
    service.getBootstrap.mockReset();
    service.getBootstrap.mockResolvedValue({
      tipoReclamos: ['Bache'],
      roles: ['ADMIN'],
      users: [1, 2],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminBootstrapController],
      providers: [
        AdminApiKeyGuard,
        { provide: AdminBootstrapService, useValue: service },
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
      .get('/api/v1/admin/bootstrap')
      .expect(401);
  });

  it('retorna bootstrap de settings', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/bootstrap')
      .set('x-api-key', adminApiKey)
      .expect(200);

    expect(response.body).toEqual({
      tipoReclamos: ['Bache'],
      roles: ['ADMIN'],
      users: [1, 2],
    });
    expect(service.getBootstrap).toHaveBeenCalledTimes(1);
  });
});
