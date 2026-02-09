import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { AdminBootstrapService } from './admin-bootstrap.service';

describe('AdminBootstrapService', () => {
  let service: AdminBootstrapService;
  let reclamoRepo: {
    query: jest.MockedFunction<
      (sql: string) => Promise<Array<{ tipo: string }>>
    >;
  };
  let historialRepo: {
    query: jest.MockedFunction<
      (sql: string) => Promise<Array<{ id: number | string }>>
    >;
  };
  let activityRepo: {
    query: jest.MockedFunction<
      (sql: string) => Promise<Array<{ id: number | string }>>
    >;
  };

  beforeEach(async () => {
    reclamoRepo = { query: jest.fn() };
    historialRepo = { query: jest.fn() };
    activityRepo = { query: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AdminBootstrapService,
        { provide: getRepositoryToken(Reclamo), useValue: reclamoRepo },
        {
          provide: getRepositoryToken(ReclamoHistorial),
          useValue: historialRepo,
        },
        { provide: getRepositoryToken(ActivityLog), useValue: activityRepo },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ADMIN_BOOTSTRAP_ROLES') {
                return 'admin, operador, operador';
              }
              return '';
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AdminBootstrapService);
  });

  it('devuelve tipos, roles y users deduplicados', async () => {
    reclamoRepo.query.mockResolvedValue([
      { tipo: 'Bache' },
      { tipo: 'Luminaria' },
    ]);
    historialRepo.query.mockResolvedValue([{ id: 1 }, { id: '2' }]);
    activityRepo.query.mockResolvedValue([{ id: 2 }, { id: '3' }]);

    const res = await service.getBootstrap();

    expect(res).toEqual({
      tipoReclamos: ['Bache', 'Luminaria'],
      roles: ['ADMIN', 'OPERADOR'],
      users: [1, 2, 3],
    });
  });

  it('usa role default cuando no hay configuracion', async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminBootstrapService,
        { provide: getRepositoryToken(Reclamo), useValue: reclamoRepo },
        {
          provide: getRepositoryToken(ReclamoHistorial),
          useValue: historialRepo,
        },
        { provide: getRepositoryToken(ActivityLog), useValue: activityRepo },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => ''),
          },
        },
      ],
    }).compile();

    service = module.get(AdminBootstrapService);
    reclamoRepo.query.mockResolvedValue([]);
    historialRepo.query.mockResolvedValue([]);
    activityRepo.query.mockResolvedValue([]);

    const res = await service.getBootstrap();
    expect(res.roles).toEqual(['ADMIN']);
  });
});
