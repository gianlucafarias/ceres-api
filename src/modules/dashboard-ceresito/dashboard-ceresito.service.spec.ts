import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../entities/contact.entity';
import { Converstation } from '../../entities/conversation.entity';
import { History } from '../../entities/history.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { RedisService } from '../../shared/redis/redis.service';
import {
  DashboardCeresitoService,
  DashboardCeresitoSummaryResponse,
} from './dashboard-ceresito.service';

type CountRepo<T> = Pick<Repository<T>, 'count'>;

describe('DashboardCeresitoService', () => {
  let service: DashboardCeresitoService;
  let contactRepo: { count: jest.MockedFunction<CountRepo<Contact>['count']> };
  let conversationRepo: {
    count: jest.MockedFunction<CountRepo<Converstation>['count']>;
  };
  let historyRepo: { count: jest.MockedFunction<CountRepo<History>['count']> };
  let reclamoRepo: { count: jest.MockedFunction<CountRepo<Reclamo>['count']> };
  let redis: {
    get: jest.MockedFunction<(key: string) => Promise<string | null>>;
    setEx: jest.MockedFunction<
      (key: string, ttlSeconds: number, value: string) => Promise<void>
    >;
  };

  beforeEach(async () => {
    contactRepo = { count: jest.fn() };
    conversationRepo = { count: jest.fn() };
    historyRepo = { count: jest.fn() };
    reclamoRepo = { count: jest.fn() };
    redis = {
      get: jest.fn(),
      setEx: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        DashboardCeresitoService,
        { provide: getRepositoryToken(Contact), useValue: contactRepo },
        {
          provide: getRepositoryToken(Converstation),
          useValue: conversationRepo,
        },
        { provide: getRepositoryToken(History), useValue: historyRepo },
        { provide: getRepositoryToken(Reclamo), useValue: reclamoRepo },
        { provide: RedisService, useValue: redis },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              if (key === 'DASHBOARD_CERESITO_CACHE_TTL_SECONDS') return '60';
              return fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(DashboardCeresitoService);
  });

  it('arma summary y cachea respuesta con treatedStatus por defecto', async () => {
    redis.get.mockResolvedValue(null);
    contactRepo.count.mockResolvedValue(10);
    conversationRepo.count.mockResolvedValue(20);
    historyRepo.count.mockResolvedValue(30);
    reclamoRepo.count.mockResolvedValueOnce(40).mockResolvedValueOnce(5);

    const res = await service.getSummary({
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(res).toMatchObject({
      uniqueUsers: 10,
      conversations: 20,
      sentMessages: 30,
      claimsReceived: 40,
      claimsHandled: 5,
    });
    expect(res.generatedAt).toEqual(expect.any(String));
    const secondReclamoCountCall = reclamoRepo.count.mock.calls[1]?.[0];
    expect(secondReclamoCountCall).toBeDefined();

    if (
      !secondReclamoCountCall ||
      typeof secondReclamoCountCall !== 'object' ||
      !('where' in secondReclamoCountCall)
    ) {
      throw new Error('Second reclamo count call is malformed');
    }

    const where = secondReclamoCountCall.where;
    if (!where || typeof where !== 'object' || !('estado' in where)) {
      throw new Error('Second reclamo count call misses "estado"');
    }

    expect(where.estado).toBe('ASIGNADO');
    expect(redis.setEx).toHaveBeenCalledTimes(1);
  });

  it('retorna cache sin consultar repositorios', async () => {
    const cached: DashboardCeresitoSummaryResponse = {
      uniqueUsers: 1,
      conversations: 2,
      sentMessages: 3,
      claimsReceived: 4,
      claimsHandled: 5,
      generatedAt: '2026-02-09T14:00:00.000Z',
    };
    redis.get.mockResolvedValue(JSON.stringify(cached));

    const res = await service.getSummary({});

    expect(res).toEqual(cached);
    expect(contactRepo.count).not.toHaveBeenCalled();
    expect(conversationRepo.count).not.toHaveBeenCalled();
    expect(historyRepo.count).not.toHaveBeenCalled();
    expect(reclamoRepo.count).not.toHaveBeenCalled();
    expect(redis.setEx).not.toHaveBeenCalled();
  });

  it('devuelve ceros cuando no hay datos', async () => {
    redis.get.mockResolvedValue(null);
    contactRepo.count.mockResolvedValue(0);
    conversationRepo.count.mockResolvedValue(0);
    historyRepo.count.mockResolvedValue(0);
    reclamoRepo.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const res = await service.getSummary({
      from: '2026-02-01',
      to: '2026-02-02',
      treatedStatus: 'COMPLETADO',
    });

    expect(res).toMatchObject({
      uniqueUsers: 0,
      conversations: 0,
      sentMessages: 0,
      claimsReceived: 0,
      claimsHandled: 0,
    });
  });

  it('lanza 400 si from es mayor que to', async () => {
    await expect(
      service.getSummary({ from: '2026-02-10', to: '2026-02-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
