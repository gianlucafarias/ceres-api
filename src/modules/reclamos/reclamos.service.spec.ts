import { Test } from '@nestjs/testing';
import { Reclamo } from '../../entities/reclamo.entity';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';
import { GeocodeService } from '../../shared/geocode/geocode.service';
import { ReclamosHistorialService } from './reclamos-historial.service';
import { ReclamosRepository } from './reclamos.repository';
import { ReclamosService } from './reclamos.service';
import { ReclamosStatsService } from './reclamos-stats.service';

describe('ReclamosService', () => {
  let service: ReclamosService;
  let reclamosRepo: {
    create: jest.MockedFunction<(input: Partial<Reclamo>) => Reclamo>;
    save: jest.MockedFunction<(input: Reclamo) => Promise<Reclamo>>;
    findById: jest.MockedFunction<(id: number) => Promise<Reclamo | null>>;
    findByTelefono: jest.MockedFunction<
      (telefono: string) => Promise<Reclamo[]>
    >;
    findAndCountForAdmin: jest.MockedFunction<
      (filters: unknown) => Promise<[Reclamo[], number]>
    >;
  };
  let historialService: {
    registrarCreacion: jest.MockedFunction<
      (reclamoId: number) => Promise<unknown>
    >;
    registrarCambioEstado: jest.MockedFunction<
      (
        id: number,
        prev: string | null,
        next: string,
        usuarioId?: number | null,
      ) => Promise<unknown>
    >;
    registrarCambioPrioridad: jest.MockedFunction<
      (
        id: number,
        prev: string | null,
        next: string,
        usuarioId?: number | null,
      ) => Promise<unknown>
    >;
    registrarCambioCuadrilla: jest.MockedFunction<
      (
        id: number,
        prev: number | null,
        next: number | null,
        usuarioId?: number | null,
      ) => Promise<unknown>
    >;
    listarPorReclamo: jest.MockedFunction<(id: number) => Promise<unknown[]>>;
  };
  let statsService: {
    countByEstado: jest.MockedFunction<() => Promise<unknown[]>>;
    countByPrioridad: jest.MockedFunction<() => Promise<unknown[]>>;
    countByTipo: jest.MockedFunction<() => Promise<unknown[]>>;
    countByBarrio: jest.MockedFunction<() => Promise<unknown[]>>;
    statsBasicas: jest.MockedFunction<() => Promise<unknown>>;
    statsAvanzadas: jest.MockedFunction<() => Promise<unknown>>;
  };
  let geocodeService: {
    geocodeAddress: jest.MockedFunction<
      (address: string) => Promise<{ latitud: number; longitud: number }>
    >;
  };
  let activityLog: {
    logActivity: jest.MockedFunction<(params: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    reclamosRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByTelefono: jest.fn(),
      findAndCountForAdmin: jest.fn(),
    };
    historialService = {
      registrarCreacion: jest.fn(),
      registrarCambioEstado: jest.fn(),
      registrarCambioPrioridad: jest.fn(),
      registrarCambioCuadrilla: jest.fn(),
      listarPorReclamo: jest.fn(),
    };
    statsService = {
      countByEstado: jest.fn(),
      countByPrioridad: jest.fn(),
      countByTipo: jest.fn(),
      countByBarrio: jest.fn(),
      statsBasicas: jest.fn(),
      statsAvanzadas: jest.fn(),
    };
    geocodeService = {
      geocodeAddress: jest.fn().mockResolvedValue({ latitud: 1, longitud: 2 }),
    };
    activityLog = {
      logActivity: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ReclamosService,
        { provide: ReclamosRepository, useValue: reclamosRepo },
        { provide: ReclamosHistorialService, useValue: historialService },
        { provide: ReclamosStatsService, useValue: statsService },
        { provide: GeocodeService, useValue: geocodeService },
        { provide: ActivityLogService, useValue: activityLog },
      ],
    }).compile();

    service = module.get(ReclamosService);
  });

  it('crear desde bot omite telefono en respuesta', async () => {
    reclamosRepo.create.mockReturnValue({
      id: 1,
      telefono: '123',
      estado: 'PENDIENTE',
    } as Reclamo);
    reclamosRepo.save.mockResolvedValue({
      id: 1,
      telefono: '123',
      estado: 'PENDIENTE',
    } as Reclamo);

    const res = await service.crearDesdeBot({
      nombre: 'a',
      telefono: '123',
      reclamo: 'algo',
      ubicacion: 'dir',
      barrio: 'b',
    });

    expect('telefono' in res).toBe(false);
    expect(historialService.registrarCreacion).toHaveBeenCalled();
    expect(activityLog.logActivity).toHaveBeenCalled();
  });

  it('estadoParaBot omite telefono', async () => {
    reclamosRepo.findById.mockResolvedValue({
      id: 1,
      telefono: '123',
    } as Reclamo);

    const res = await service.estadoParaBot(1);

    expect(res).not.toBeNull();
    expect(res && 'telefono' in res).toBe(false);
  });
});
