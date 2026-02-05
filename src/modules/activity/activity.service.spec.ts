import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';
import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let repo: { find: jest.MockedFunction<(options?: unknown) => Promise<ActivityLog[]>> };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: getRepositoryToken(ActivityLog), useValue: repo },
      ],
    }).compile();

    service = module.get(ActivityService);
  });

  it('formatea timeAgo y aplica limite default', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-05T12:00:00Z'));

    repo.find.mockResolvedValue([
      {
        id: 1,
        type: 'RECLAMO',
        action: 'CREACION',
        description: 'test',
        entityId: 10,
        userId: null,
        createdAt: new Date('2026-02-05T11:59:30Z'),
        metadata: { foo: 'bar' },
      } as ActivityLog,
    ]);

    const res = await service.getRecentActivities({});
    expect(repo.find).toHaveBeenCalledWith({
      where: {},
      order: { createdAt: 'DESC' },
      take: 10,
    });
    expect(res[0].timeAgo).toBe('Hace unos segundos');

    jest.useRealTimers();
  });

  it('filtra por tipo y limite', async () => {
    repo.find.mockResolvedValue([]);
    await service.getRecentActivities({ type: 'RECLAMO', limit: 5 });
    expect(repo.find).toHaveBeenCalledWith({
      where: { type: 'RECLAMO' },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  });
});
