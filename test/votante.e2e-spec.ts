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
import { BotApiKeyGuard } from '../src/common/guards/bot-api-key.guard';
import { VotanteController } from '../src/modules/votante/votante.controller';
import { VotanteService } from '../src/modules/votante/votante.service';

describe('Votante (e2e)', () => {
  let app: INestApplication<App>;
  const botApiKey = 'bot-key-test';
  const adminApiKey = 'admin-key-test';

  const service = {
    obtenerPorDocumento: jest.fn(),
    importar: jest.fn(),
  };

  beforeEach(async () => {
    service.obtenerPorDocumento.mockReset();
    service.importar.mockReset();

    service.obtenerPorDocumento.mockResolvedValue({
      mesa: '2555',
      nombre: 'Juan Perez',
      documento: '12345678',
      orden: '001',
      direccion: 'Av. Siempre Viva 123',
    });
    service.importar.mockResolvedValue({ inserted: 1, replaced: true });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VotanteController],
      providers: [
        BotApiKeyGuard,
        AdminApiKeyGuard,
        { provide: VotanteService, useValue: service },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'BOT_API_KEY') return botApiKey;
              if (key === 'ADMIN_API_KEY') return adminApiKey;
              return undefined;
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

  it('GET /api/v1/votante/:documento requiere BOT_API_KEY', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/votante/12345678')
      .expect(401);
  });

  it('GET /api/v1/votante/:documento responde contrato bot', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/votante/12345678')
      .set('x-api-key', botApiKey)
      .expect(200);

    expect(response.body).toEqual({
      mesa: '2555',
      nombre: 'Juan Perez',
      documento: '12345678',
      orden: '001',
      direccion: 'Av. Siempre Viva 123',
    });
    expect(service.obtenerPorDocumento).toHaveBeenCalledWith('12345678');
  });

  it('POST /api/v1/votante/importar requiere ADMIN_API_KEY', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/votante/importar')
      .send({
        registros: [],
        reemplazar: true,
      })
      .expect(401);
  });

  it('POST /api/v1/votante/importar importa registros', async () => {
    const payload = {
      reemplazar: true,
      registros: [
        {
          mesa: '1',
          orden: '2',
          nombre: 'Nombre',
          direccion: 'Direccion',
          documento: '11111111',
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/votante/importar')
      .set('x-api-key', adminApiKey)
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({ inserted: 1, replaced: true });
    expect(service.importar).toHaveBeenCalledWith(payload);
  });
});
