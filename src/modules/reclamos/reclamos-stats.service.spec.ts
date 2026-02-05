import { Test } from '@nestjs/testing';
import { ReclamosRepository } from './reclamos.repository';
import { ReclamosStatsService } from './reclamos-stats.service';

describe('ReclamosStatsService', () => {
  let service: ReclamosStatsService;
  let reclamosRepo: { createQueryBuilder: jest.MockedFunction<() => QueryBuilderMock> };

  type QueryBuilderMock = {
    select: jest.MockedFunction<(sql: string, alias?: string) => QueryBuilderMock>;
    addSelect: jest.MockedFunction<(sql: string, alias?: string) => QueryBuilderMock>;
    groupBy: jest.MockedFunction<(sql: string) => QueryBuilderMock>;
    where: jest.MockedFunction<(sql: string, params?: Record<string, unknown>) => QueryBuilderMock>;
    andWhere: jest.MockedFunction<(sql: string, params?: Record<string, unknown>) => QueryBuilderMock>;
    orderBy: jest.MockedFunction<(sql: string, order?: 'ASC' | 'DESC') => QueryBuilderMock>;
    innerJoin: jest.MockedFunction<(table: unknown, alias: string, condition: string) => QueryBuilderMock>;
    getRawMany: jest.MockedFunction<() => Promise<Array<Record<string, unknown>>>>;
    getRawOne: jest.MockedFunction<() => Promise<Record<string, unknown>>>;
  };

  beforeEach(async () => {
    reclamosRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ReclamosStatsService,
        { provide: ReclamosRepository, useValue: reclamosRepo },
      ],
    }).compile();

    service = module.get(ReclamosStatsService);
  });

  it('countByEstado devuelve conteo', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ estado: 'PENDIENTE', count: '2' }]),
    } as QueryBuilderMock;

    reclamosRepo.createQueryBuilder.mockReturnValueOnce(qb);

    const res = await service.countByEstado();
    expect(res).toEqual([{ estado: 'PENDIENTE', count: '2' }]);
    expect(reclamosRepo.createQueryBuilder).toHaveBeenCalledWith('reclamo');
  });

  it('statsAvanzadas arma respuesta con promedios y eficiencia', async () => {
    const qbMes = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ mes: '2026-01-01', cantidad: '4' }]),
    } as QueryBuilderMock;

    const qbTiempo = {
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ promedioDias: '3' }),
    } as QueryBuilderMock;

    const qbEfic = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ cuadrillaId: 1, reclamosResueltos: '5' }]),
    } as QueryBuilderMock;

    reclamosRepo.createQueryBuilder
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
