import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';

export interface ActivityLogParams {
  type: string;
  action: string;
  description: string;
  entityId?: number;
  userId?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  async logActivity(params: ActivityLogParams): Promise<ActivityLog> {
    const activity = this.repo.create({
      type: params.type,
      action: params.action,
      description: params.description,
      entityId: params.entityId,
      userId: params.userId,
      metadata: params.metadata,
    });

    return this.repo.save(activity);
  }
}
