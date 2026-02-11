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
import { ReclamosBotController } from '../src/modules/reclamos/reclamos.bot.controller';
import { ReclamosService } from '../src/modules/reclamos/reclamos.service';

describe('Reclamos bot endpoints extra (e2e)', () => {
  let app: INestApplication<App>;
  const botApiKey = 'bot-key-test';
  const service = {
    crearDesdeBot: jest.fn(),
    estadoParaBot: jest.fn(),
    tiposParaBot: jest.fn(),
    ultimoPorTelefonoParaBot: jest.fn(),
  };

  beforeEach(async () => {
    service.crearDesdeBot.mockReset();
    service.estadoParaBot.mockReset();
    service.tiposParaBot.mockReset();
    service.ultimoPorTelefonoParaBot.mockReset();

    service.tiposParaBot.mockResolvedValue([
      { id: 1, nombre: 'Bache' },
      { id: 2, nombre: 'Luminaria' },
    ]);
    service.ultimoPorTelefonoParaBot.mockResolvedValue({
      id: 99,
      fecha: '2026-02-10T10:00:00.000Z',
      reclamo: 'Bache',
      estado: 'PENDIENTE',
      ubicacion: 'San Martin 123',
      barrio: 'Centro',
      detalle: 'Detalle',
      prioridad: 'MEDIA',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReclamosBotController],
      providers: [
        BotApiKeyGuard,
        { provide: ReclamosService, useValue: service },
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

  it('GET /api/v1/reclamos/tipos requiere BOT_API_KEY', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/reclamos/tipos')
      .expect(401);
  });

  it('GET /api/v1/reclamos/tipos devuelve tipos', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reclamos/tipos')
      .set('x-api-key', botApiKey)
      .expect(200);

    expect(response.body).toEqual([
      { id: 1, nombre: 'Bache' },
      { id: 2, nombre: 'Luminaria' },
    ]);
  });

  it('GET /api/v1/reclamos/bot/ultimo devuelve ultimo reclamo por telefono', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reclamos/bot/ultimo?telefono=5493491555555')
      .set('x-api-key', botApiKey)
      .expect(200);

    expect(response.body).toHaveProperty('id', 99);
    expect(service.ultimoPorTelefonoParaBot).toHaveBeenCalledWith(
      '5493491555555',
    );
  });

  it('GET /api/v1/reclamos/bot/ultimo valida query', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/reclamos/bot/ultimo')
      .set('x-api-key', botApiKey)
      .expect(400);
  });
});
