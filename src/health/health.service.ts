import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../shared/redis/redis.service';

export type HealthStatus = {
  status: 'ok' | 'error';
  checks: {
    database: { status: 'up' | 'down'; latencyMs?: number; error?: string };
    redis: { status: 'up' | 'down'; latencyMs?: number; error?: string };
  };
};

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async check(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = {
      database: { status: 'down' },
      redis: { status: 'down' },
    };

    // DB check
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      checks.database = { status: 'up', latencyMs: Date.now() - start };
    } catch (err: any) {
      checks.database = { status: 'down', error: err?.message };
    }

    // Redis check (optional)
    try {
      const start = Date.now();
      await this.redisService.ping();
      checks.redis = { status: 'up', latencyMs: Date.now() - start };
    } catch (err: any) {
      checks.redis = { status: 'down', error: err?.message };
    }

    const status: HealthStatus['status'] =
      checks.database.status === 'up' ? 'ok' : 'error';

    return { status, checks };
  }
}
