import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { Converstation } from '../../entities/conversation.entity';
import { ContactsService } from './contacts.service';

describe('ContactsService', () => {
  let service: ContactsService;
  let contactRepo: ReturnType<typeof mockRepo>;
  let historyRepo: ReturnType<typeof mockRepo>;
  let reclamoRepo: ReturnType<typeof mockRepo>;
  let conversationRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    contactRepo = mockRepo();
    historyRepo = mockRepo();
    reclamoRepo = mockRepo();
    conversationRepo = mockRepo();

    const module = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: getRepositoryToken(Contact), useValue: contactRepo },
        { provide: getRepositoryToken(History), useValue: historyRepo },
        { provide: getRepositoryToken(Reclamo), useValue: reclamoRepo },
        {
          provide: getRepositoryToken(Converstation),
          useValue: conversationRepo,
        },
      ],
    }).compile();

    service = module.get(ContactsService);
  });

  it('normaliza order case-insensitive en getContacts', async () => {
    await service.getContacts({
      sort: 'createdAt',
      order: 'asc' as 'ASC',
    });

    expect(contactRepo.find).toHaveBeenCalledWith({
      order: { createdAt: 'ASC' },
    });
  });

  it('pagina conversaciones por contacto', async () => {
    conversationRepo.queryBuilder.getManyAndCount.mockResolvedValue([
      [{ id: 10 }],
      3,
    ]);

    const result = await service.getContactConversations(5, {
      page: 2,
      limit: 1,
    });

    expect(conversationRepo.createQueryBuilder).toHaveBeenCalledWith(
      'conversacion',
    );
    expect(conversationRepo.queryBuilder.where).toHaveBeenCalledWith(
      'conversacion.contact_id = :id',
      { id: 5 },
    );
    expect(conversationRepo.queryBuilder.skip).toHaveBeenCalledWith(1);
    expect(conversationRepo.queryBuilder.take).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      items: [{ id: 10 }],
      total: 3,
      page: 2,
      pageSize: 1,
    });
  });
});

function mockRepo() {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  return {
    queryBuilder,
    createQueryBuilder: jest.fn(() => queryBuilder),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
  };
}
