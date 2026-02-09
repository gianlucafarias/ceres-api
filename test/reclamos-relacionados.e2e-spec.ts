import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Reclamo } from '../src/entities/reclamo.entity';
import { AdminApiKeyGuard } from '../src/common/guards/admin-api-key.guard';
import { ActivityLogService } from '../src/shared/activity-log/activity-log.service';
import { GeocodeService } from '../src/shared/geocode/geocode.service';
import { ReclamosAdminController } from '../src/modules/reclamos/reclamos.admin.controller';
import { ReclamosHistorialService } from '../src/modules/reclamos/reclamos-historial.service';
import { ReclamosRepository } from '../src/modules/reclamos/reclamos.repository';
import { ReclamosService } from '../src/modules/reclamos/reclamos.service';
import { ReclamosStatsService } from '../src/modules/reclamos/reclamos-stats.service';

describe('Reclamos relacionados (e2e)', () => {
  let app: INestApplication<App>;
  const adminApiKey = 'admin-key-test';

  let reclamosRepo: {
    findById: jest.MockedFunction<(id: number) => Promise<Reclamo | null>>;
    findByTelefono: jest.MockedFunction<
      (telefono: string) => Promise<Reclamo[]>
    >;
  };

  beforeEach(async () => {
    reclamosRepo = {
      findById: jest.fn(),
      findByTelefono: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReclamosAdminController],
      providers: [
        ReclamosService,
        AdminApiKeyGuard,
        { provide: ReclamosRepository, useValue: reclamosRepo },
        {
          provide: ReclamosHistorialService,
          useValue: {
            listarPorReclamo: jest.fn(),
            registrarCreacion: jest.fn(),
            registrarCambioEstado: jest.fn(),
            registrarCambioPrioridad: jest.fn(),
            registrarCambioCuadrilla: jest.fn(),
          },
        },
        {
          provide: ReclamosStatsService,
          useValue: {
            countByEstado: jest.fn(),
            countByPrioridad: jest.fn(),
            countByTipo: jest.fn(),
            countByBarrio: jest.fn(),
            statsBasicas: jest.fn(),
            statsAvanzadas: jest.fn(),
          },
        },
        {
          provide: GeocodeService,
          useValue: {
            geocodeAddress: jest.fn(),
          },
        },
        {
          provide: ActivityLogService,
          useValue: {
            logActivity: jest.fn(),
          },
        },
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

  it('GET /api/v1/reclamos/:id/relacionados devuelve data sin PII', async () => {
    const current = buildReclamo({ id: 10, telefono: '3491123456' });
    const related = buildReclamo({
      id: 11,
      telefono: '3491123456',
      detalle: 'Detalle relacionado',
    });

    reclamosRepo.findById.mockResolvedValue(current);
    reclamosRepo.findByTelefono.mockResolvedValue([current, related]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/reclamos/10/relacionados')
      .set('x-api-key', adminApiKey)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: 11,
          fecha: related.fecha.toISOString(),
          reclamo: related.reclamo,
          estado: related.estado,
          barrio: related.barrio,
          ubicacion: related.ubicacion,
          detalle: related.detalle,
        },
      ],
      total: 1,
    });
    expect(response.body).not.toHaveProperty('data.0.telefono');
    expect(response.body).not.toHaveProperty('data.0.dni');
    expect(response.body).not.toHaveProperty('data.0.email');
  });

  it('GET /api/v1/reclamos/:id/relacionados devuelve 404 si no existe id', async () => {
    reclamosRepo.findById.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/api/v1/reclamos/999999/relacionados')
      .set('x-api-key', adminApiKey)
      .expect(404);
  });

  it('GET /api/v1/reclamos/:id/relacionados devuelve data vacia si no hay relacionados', async () => {
    const current = buildReclamo({ id: 10, telefono: '3491123456' });
    reclamosRepo.findById.mockResolvedValue(current);
    reclamosRepo.findByTelefono.mockResolvedValue([current]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/reclamos/10/relacionados')
      .set('x-api-key', adminApiKey)
      .expect(200);

    expect(response.body).toEqual({ data: [], total: 0 });
  });

  it('GET /api/v1/reclamos/:id/relacionados requiere ADMIN_API_KEY', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/reclamos/10/relacionados')
      .expect(401);
  });
});

function buildReclamo(overrides: Partial<Reclamo> = {}): Reclamo {
  return {
    id: 1,
    fecha: new Date('2026-02-01T10:00:00.000Z'),
    nombre: 'Juan Perez',
    reclamo: 'Bache',
    ubicacion: 'San Martin 123',
    barrio: 'Centro',
    telefono: '3491123456',
    estado: 'PENDIENTE',
    detalle: 'Detalle',
    prioridad: 'MEDIA',
    latitud: null,
    longitud: null,
    cuadrillaid: null,
    ...overrides,
  };
}
