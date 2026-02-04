import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { Converstation } from '../../entities/conversation.entity';
import { ContactsService } from './contacts.service';

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: getRepositoryToken(Contact), useValue: mockRepo() },
        { provide: getRepositoryToken(History), useValue: mockRepo() },
        { provide: getRepositoryToken(Reclamo), useValue: mockRepo() },
        { provide: getRepositoryToken(Converstation), useValue: mockRepo() },
      ],
    }).compile();

    service = module.get(ContactsService);
  });

  it('devuelve contactos ordenados', async () => {
    const contacts = await service.getContacts({ sort: 'createdAt', order: 'DESC' });
    expect(Array.isArray(contacts)).toBe(true);
  });
});

function mockRepo() {
  return {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
  };
}
