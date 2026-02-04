import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let historyRepo: any;

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

function mockRepo() {
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
