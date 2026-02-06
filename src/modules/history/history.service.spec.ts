import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let historyRepo: RepoMock;

  type RepoMock = {
    createQueryBuilder: jest.Mock<unknown, []>;
    find: jest.Mock<Promise<History[]>, [unknown?]>;
    findAndCount: jest.Mock<Promise<[History[], number]>, [unknown?]>;
    count: jest.Mock<Promise<number>, [unknown?]>;
  };

  beforeEach(async () => {
    const qb = {
      where: () => qb,
      andWhere: () => qb,
      orderBy: () => qb,
      groupBy: () => qb,
      limit: () => qb,
      getMany: () => Promise.resolve([] as History[]),
      getRawMany: () => Promise.resolve([] as Array<Record<string, unknown>>),
      getCount: () => Promise.resolve(0),
    };

    historyRepo = {
      createQueryBuilder: jest.fn<unknown, []>().mockReturnValue(qb),
      find: jest.fn<Promise<History[]>, [unknown?]>().mockResolvedValue([]),
      findAndCount: jest
        .fn<Promise<[History[], number]>, [unknown?]>()
        .mockResolvedValue([[], 0]),
      count: jest.fn<Promise<number>, [unknown?]>().mockResolvedValue(0),
    };

    const module = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: getRepositoryToken(History), useValue: historyRepo },
        { provide: getRepositoryToken(Contact), useValue: {} },
      ],
    }).compile();

    service = module.get(HistoryService);
  });

  it('last day interactions usa query builder', async () => {
    await service.getLastDayInteractions();
    expect(historyRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('conversation by id delega a find', async () => {
    historyRepo.find.mockResolvedValue([{ id: 1 } as History]);
    const res = await service.getInteractionsByConversationId({
      conversationId: 'abc',
    });
    expect(res).toHaveLength(1);
  });
});
