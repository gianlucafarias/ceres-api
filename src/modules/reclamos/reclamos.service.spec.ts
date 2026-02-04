import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { ReclamosService } from './reclamos.service';

describe('ReclamosService', () => {
  let service: ReclamosService;
  let reclamoRepo: any;
  let historialRepo: any;

  beforeEach(async () => {
    reclamoRepo = mockRepo();
    historialRepo = { create: jest.fn((x) => x), save: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ReclamosService,
        { provide: getRepositoryToken(Reclamo), useValue: reclamoRepo },
        { provide: getRepositoryToken(ReclamoHistorial), useValue: historialRepo },
      ],
    }).compile();

    service = module.get(ReclamosService);
  });

  it('crear desde bot omite telefono en respuesta', async () => {
    reclamoRepo.create.mockReturnValue({ id: 1, telefono: '123', estado: 'PENDIENTE' });
    reclamoRepo.save.mockResolvedValue({ id: 1, telefono: '123', estado: 'PENDIENTE' });
    const res = await service.crearDesdeBot({
      nombre: 'a',
      telefono: '123',
      reclamo: 'algo',
      ubicacion: 'dir',
      barrio: 'b',
    });
    expect((res as any).telefono).toBeUndefined();
    expect(historialRepo.save).toHaveBeenCalled();
  });

  it('estadoParaBot omite telefono', async () => {
    reclamoRepo.findOne.mockResolvedValue({ id: 1, telefono: '123' });
    const res = await service.estadoParaBot(1);
    expect((res as any)?.telefono).toBeUndefined();
  });

  it('countByEstado devuelve conteo', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ estado: 'PENDIENTE', count: '2' }]),
    };
    reclamoRepo.createQueryBuilder.mockReturnValueOnce(qb);

    const res = await service.countByEstado();
    expect(res).toEqual([{ estado: 'PENDIENTE', count: '2' }]);
    expect(reclamoRepo.createQueryBuilder).toHaveBeenCalledWith('reclamo');
  });

  it('statsAvanzadas arma respuesta con promedios y eficiencia', async () => {
    const qbMes = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ mes: '2026-01-01', cantidad: '4' }]),
    };
    const qbTiempo = {
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ promedioDias: '3' }),
    };
    const qbEfic = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ cuadrillaId: 1, reclamosResueltos: '5' }]),
    };
    reclamoRepo.createQueryBuilder
      .mockReturnValueOnce(qbMes)
      .mockReturnValueOnce(qbTiempo)
      .mockReturnValueOnce(qbEfic);

    const res = await service.statsAvanzadas();
    expect(res).toEqual({
      reclamosPorMes: [{ mes: '2026-01-01', cantidad: '4' }],
      tiempoPromedioResolucion: '3',
      eficienciaCuadrilla: [{ cuadrillaId: 1, reclamosResueltos: '5' }],
    });
  });
});

function mockRepo() {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
      getRawOne: jest.fn().mockResolvedValue({}),
    })),
  };
}
