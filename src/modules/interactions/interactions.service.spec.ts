import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { History } from '../../entities/history.entity';
import { InteractionsService } from './interactions.service';

describe('InteractionsService', () => {
  let service: InteractionsService;
  let qbMock: QueryBuilderMock;
  let repoMock: {
    createQueryBuilder: jest.MockedFunction<() => QueryBuilderMock>;
    count: jest.MockedFunction<() => Promise<number>>;
  };

  type QueryBuilderMock = {
    select: jest.MockedFunction<(sql: string, alias?: string) => QueryBuilderMock>;
    addSelect: jest.MockedFunction<(sql: string, alias?: string) => QueryBuilderMock>;
    where: jest.MockedFunction<(sql: string, params?: Record<string, unknown>) => QueryBuilderMock>;
    andWhere: jest.MockedFunction<(sql: string, params?: Record<string, unknown>) => QueryBuilderMock>;
    groupBy: jest.MockedFunction<(sql: string) => QueryBuilderMock>;
    orderBy: jest.MockedFunction<(sql: string, order?: 'ASC' | 'DESC') => QueryBuilderMock>;
    getRawMany: jest.MockedFunction<() => Promise<Array<{ group: string; count: string }>>>;
    getCount: jest.MockedFunction<() => Promise<number>>;
  };

  beforeEach(async () => {
    qbMock = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ group: '2026-02-03', count: '2' }]),
      getCount: jest.fn().mockResolvedValue(1),
    };

    repoMock = {
      createQueryBuilder: jest.fn(() => qbMock),
      count: jest.fn().mockResolvedValue(7),
    };

    const module = await Test.createTestingModule({
      providers: [
        InteractionsService,
        { provide: getRepositoryToken(History), useValue: repoMock },
      ],
    }).compile();

    service = module.get(InteractionsService);
  });

  it('agrupa por día', async () => {
    const res = await service.getInteractionsLastWeek({
      start_date: '2026-02-01',
      end_date: '2026-02-03',
      group_by: 'day',
    });
    expect(res[0]).toEqual({ group: '2026-02-03', count: 2 });
  });

  it('count sin rango usa count()', async () => {
    const res = await service.getInteractionsCount({});
    expect(res).toEqual({ count: 7 });
    expect(repoMock.count).toHaveBeenCalled();
  });
});
