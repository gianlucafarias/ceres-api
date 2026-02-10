import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Feedback } from '../../entities/feedback.entity';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let repo: {
    createQueryBuilder: jest.MockedFunction<() => FeedbackQbMock>;
  };
  let qb: FeedbackQbMock;

  type FeedbackQbMock = {
    select: jest.MockedFunction<(...args: unknown[]) => FeedbackQbMock>;
    addSelect: jest.MockedFunction<(...args: unknown[]) => FeedbackQbMock>;
    orderBy: jest.MockedFunction<(...args: unknown[]) => FeedbackQbMock>;
    getRawMany: jest.MockedFunction<
      () =>
        Promise<
          Array<{
            id: string;
            nombre: string;
            calificacion: string;
            comentario: string | null;
            timestamp: string;
            conversation_id: string | null;
            contact_id: string | null;
          }>
        >
    >;
  };

  beforeEach(async () => {
    qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          nombre: 'Test',
          calificacion: '⭐️ excelente',
          comentario: 'ok',
          timestamp: '2026-01-01T10:00:00.000Z',
          conversation_id: 'cid-1',
          contact_id: '8',
        },
      ]),
    };

    repo = {
      createQueryBuilder: jest.fn(() => qb),
    };

    const module = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: repo },
      ],
    }).compile();

    service = module.get(FeedbackService);
  });

  it('devuelve feedback', async () => {
    const res = await service.getAll();
    expect(res.length).toBe(1);
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('feedback');
    expect(res[0]).toEqual(
      expect.objectContaining({
        id: 1,
        conversation_id: 'cid-1',
        contact_id: 8,
      }),
    );
  });
});
