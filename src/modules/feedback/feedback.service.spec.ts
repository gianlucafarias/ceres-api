import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Feedback } from '../../entities/feedback.entity';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([{ id: 1 }]),
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
    expect(repo.find).toHaveBeenCalled();
  });
});
