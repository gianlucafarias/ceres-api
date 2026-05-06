import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpClient } from '../../shared/http/http-client.service';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let historyRepo: RepoMock;
  let contactRepo: { findOne: jest.Mock<Promise<Contact | null>, [unknown?]> };
  let http: { post: jest.Mock<Promise<unknown>, [string, unknown, unknown?]> };

  type RepoMock = {
    createQueryBuilder: jest.Mock<unknown, []>;
    find: jest.Mock<Promise<History[]>, [unknown?]>;
    findAndCount: jest.Mock<Promise<[History[], number]>, [unknown?]>;
    count: jest.Mock<Promise<number>, [unknown?]>;
    save: jest.Mock<Promise<History>, [unknown?]>;
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
      save: jest
        .fn<Promise<History>, [unknown?]>()
        .mockResolvedValue({} as History),
    };
    contactRepo = {
      findOne: jest
        .fn<Promise<Contact | null>, [unknown?]>()
        .mockResolvedValue(null),
    };
    http = {
      post: jest.fn<Promise<unknown>, [string, unknown, unknown?]>(),
    };

    const module = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: getRepositoryToken(History), useValue: historyRepo },
        { provide: getRepositoryToken(Contact), useValue: contactRepo },
        { provide: HttpClient, useValue: http },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'BOT_BASE_URL' ? 'https://api.ceres.gob.ar' : undefined,
            ),
          },
        },
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

  it('history by phone devuelve contrato paginado unificado', async () => {
    historyRepo.findAndCount.mockResolvedValue([[{ id: 1 } as History], 3]);

    const result = await service.getHistoryByPhone({
      phone: '3491123456',
      page: 2,
      limit: 1,
    });

    expect(historyRepo.findAndCount).toHaveBeenCalledWith({
      where: { phone: '3491123456' },
      order: { createdAt: 'DESC' },
      skip: 1,
      take: 1,
    });
    expect(result).toEqual({
      items: [{ id: 1 }],
      total: 3,
      page: 2,
      pageSize: 1,
    });
  });

  it('conversation details hace fallback por contacto cuando no encuentra conversationId', async () => {
    historyRepo.find.mockResolvedValue([]);
    historyRepo.findAndCount.mockResolvedValue([[{ id: 10 } as History], 1]);

    const result = await service.getConversationDetails({
      conversationId: 'missing-conversation',
      contactId: 8,
      page: 1,
      limit: 10,
    });

    expect(historyRepo.find).toHaveBeenCalledWith({
      where: { conversation_id: 'missing-conversation' },
      order: { createdAt: 'ASC' },
    });
    expect(historyRepo.findAndCount).toHaveBeenCalledWith({
      where: { contact: { id: 8 } },
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 10,
    });
    expect(result).toEqual({
      messages: [{ id: 10 }],
      totalMessages: 1,
      currentPage: 1,
      totalPages: 1,
    });
  });

  it('conversation details devuelve estructura vacia cuando no hay identificadores', async () => {
    const result = await service.getConversationDetails({});

    expect(result).toEqual({
      messages: [],
      totalMessages: 0,
      currentPage: 1,
      totalPages: 0,
    });
  });

  it('sendHumanMessage lanza NotFound cuando no existe contacto', async () => {
    await expect(
      service.sendHumanMessage({
        contactId: 999,
        message: 'Hola',
      }),
    ).rejects.toThrow('Contacto no encontrado o sin teléfono');
  });

  it('sendHumanMessage envía al endpoint del bot', async () => {
    contactRepo.findOne.mockResolvedValue({
      id: 12,
      phone: '3491123456',
    } as Contact);
    http.post.mockResolvedValue('sended');

    await expect(
      service.sendHumanMessage({
        contactId: 12,
        message: 'Hola desde dashboard',
        conversationId: 'cid-1',
      }),
    ).resolves.toEqual({
      success: true,
      message: 'Mensaje enviado correctamente',
    });

    expect(http.post).toHaveBeenCalledWith(
      'https://api.ceres.gob.ar/v1/messages',
      { number: '3491123456', message: 'Hola desde dashboard' },
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(historyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: 'human_message',
        keyword: 'human_message_sent',
        answer: 'Hola desde dashboard',
        phone: '3491123456',
        conversation_id: 'cid-1',
        contactId: 12,
      }),
    );
  });

  it('sendHumanMessage transforma error upstream en BadGateway', async () => {
    contactRepo.findOne.mockResolvedValue({
      id: 15,
      phone: '3491555000',
    } as Contact);
    http.post.mockRejectedValue(new Error('timeout'));

    await expect(
      service.sendHumanMessage({
        contactId: 15,
        message: 'Ping',
      }),
    ).rejects.toThrow('No se pudo enviar el mensaje al proveedor de bot');
  });

  it('humanHandoff take llama blacklist add', async () => {
    contactRepo.findOne.mockResolvedValue({
      id: 20,
      phone: '3491999888',
    } as Contact);
    http.post.mockResolvedValue({ status: 'ok', intent: 'add' });

    await expect(
      service.humanHandoff({
        contactId: 20,
        action: 'take',
        conversationId: 'cid-20',
      }),
    ).resolves.toEqual({
      success: true,
      mode: 'human',
      message: 'Conversación tomada por humano',
    });

    expect(http.post).toHaveBeenCalledWith(
      'https://api.ceres.gob.ar/v1/blacklist',
      { number: '3491999888', intent: 'add', conversationId: 'cid-20' },
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(historyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: 'human_handoff_take',
        keyword: 'human_handoff_take',
        answer: 'Conversación tomada por humano',
        conversation_id: 'cid-20',
        contactId: 20,
      }),
    );
  });

  it('humanHandoff release llama blacklist remove', async () => {
    contactRepo.findOne.mockResolvedValue({
      id: 21,
      phone: '3491777666',
    } as Contact);
    http.post.mockResolvedValue({ status: 'ok', intent: 'remove' });

    await expect(
      service.humanHandoff({
        contactId: 21,
        action: 'release',
      }),
    ).resolves.toEqual({
      success: true,
      mode: 'bot',
      message: 'Conversación devuelta al bot',
    });

    expect(http.post).toHaveBeenCalledWith(
      'https://api.ceres.gob.ar/v1/blacklist',
      { number: '3491777666', intent: 'remove', conversationId: null },
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(historyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: 'human_handoff_release',
        keyword: 'human_handoff_release',
        answer: 'Conversación devuelta al bot',
        conversation_id: null,
        contactId: 21,
      }),
    );
  });
});
