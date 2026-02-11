import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';
import { ActivityQueryDto, CreateActivityDto } from './dto/activity.dto';

export interface ActivityResponse {
  id: number;
  type: string;
  action: string;
  description: string;
  entityId?: number | null;
  userId?: number | null;
  createdAt: Date;
  metadata?: Record<string, unknown>;
  timeAgo: string;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  async getRecentActivities(
    query: ActivityQueryDto,
  ): Promise<ActivityResponse[]> {
    const limit = query.limit ?? 10;
    const where = query.type ? { type: query.type } : {};

    const activities = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return activities.map((activity) => this.toResponse(activity));
  }

  async createActivity(dto: CreateActivityDto): Promise<ActivityResponse> {
    const activity = this.repo.create({
      type: dto.type,
      action: dto.action,
      description: dto.description,
      entityId: dto.entityId,
      userId: dto.userId,
      metadata: dto.metadata,
    });
    const saved = await this.repo.save(activity);
    return this.toResponse(saved);
  }

  private formatTimeAgo(date: Date, now: Date = new Date()): string {
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Hace unos segundos';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  }

  private toResponse(activity: ActivityLog): ActivityResponse {
    return {
      id: activity.id,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      entityId: activity.entityId ?? null,
      userId: activity.userId ?? null,
      createdAt: activity.createdAt,
      metadata: activity.metadata,
      timeAgo: this.formatTimeAgo(activity.createdAt),
    };
  }
}
