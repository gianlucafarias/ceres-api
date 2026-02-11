import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { BotApiKeyGuard } from '../src/common/guards/bot-api-key.guard';
import { CertificadosController } from '../src/modules/certificados/certificados.controller';
import { CertificadosService } from '../src/modules/certificados/certificados.service';

describe('Certificados (e2e)', () => {
  let app: INestApplication<App>;
  const botApiKey = 'bot-key-test';
  const service = {
    crear: jest.fn(),
  };

  beforeEach(async () => {
    service.crear.mockReset();
    service.crear.mockResolvedValue(
      '/modified_certificates/certificado-12345678.pdf',
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CertificadosController],
      providers: [
        BotApiKeyGuard,
        { provide: CertificadosService, useValue: service },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'BOT_API_KEY' ? botApiKey : undefined,
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

  it('POST /api/v1/certificados/crear requiere BOT_API_KEY', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/certificados/crear')
      .send({ name: 'Juan Perez', documentNumber: '12345678' })
      .expect(401);
  });

  it('POST /api/v1/certificados/crear responde pdfUrl estable', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/certificados/crear')
      .set('x-api-key', botApiKey)
      .send({ name: 'Juan Perez', documentNumber: '12345678' })
      .expect(201);

    const body = response.body as { pdfUrl: string };
    expect(body.pdfUrl).toMatch(
      /\/modified_certificates\/certificado-12345678\.pdf$/,
    );
    expect(service.crear).toHaveBeenCalledWith({
      name: 'Juan Perez',
      documentNumber: '12345678',
    });
  });

  it('POST /api/v1/certificados/crear valida body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/certificados/crear')
      .set('x-api-key', botApiKey)
      .send({ name: '', documentNumber: '' })
      .expect(400);
  });
});
