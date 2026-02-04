import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let historyRepo: RepoMock;

  type QueryBuilderMock = {
    where: jest.MockedFunction<(sql: string, params?: Record<string, unknown>) => QueryBuilderMock>;
    andWhere: jest.MockedFunction<(sql: string, params?: Record<string, unknown>) => QueryBuilderMock>;
    orderBy: jest.MockedFunction<(sql: string, order?: 'ASC' | 'DESC') => QueryBuilderMock>;
    groupBy: jest.MockedFunction<(sql: string) => QueryBuilderMock>;
    limit: jest.MockedFunction<(limit: number) => QueryBuilderMock>;
    getMany: jest.MockedFunction<() => Promise<History[]>>;
    getRawMany: jest.MockedFunction<() => Promise<Array<Record<string, unknown>>>>;
    getCount: jest.MockedFunction<() => Promise<number>>;
  };

  type RepoMock = {
    createQueryBuilder: jest.MockedFunction<() => QueryBuilderMock>;
    find: jest.MockedFunction<(options?: unknown) => Promise<History[]>>;
    findAndCount: jest.MockedFunction<(options?: unknown) => Promise<[History[], number]>>;
    count: jest.MockedFunction<(options?: unknown) => Promise<number>>;
  };

  beforeEach(async () => {
    historyRepo = mockRepo();
    const module = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: getRepositoryToken(History), useValue: historyRepo },
        { provide: getRepositoryToken(Contact), useValue: mockRepo() },
      ],
    }).compile();

    service = module.get(HistoryService);
  });

  it('last day interactions usa query builder', async () => {
    await service.getLastDayInteractions();
    expect(historyRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('conversation by id delega a find', async () => {
    historyRepo.find.mockResolvedValue([{ id: 1 }]);
    const res = await service.getInteractionsByConversationId({ conversationId: 'abc' });
    expect(res).toHaveLength(1);
  });
});

function mockRepo(): RepoMock {
  return {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getRawMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    })),
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    count: jest.fn().mockResolvedValue(0),
  };
}
