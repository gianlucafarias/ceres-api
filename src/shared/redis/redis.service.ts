import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (this.shouldInitialize()) {
      await this.connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  private shouldInitialize(): boolean {
    return !!this.config.get<string>('REDIS_HOST');
  }

  isEnabled(): boolean {
    return this.shouldInitialize();
  }

  async connect(): Promise<void> {
    if (this.client?.isOpen) return;

    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = parseInt(this.config.get<string>('REDIS_PORT', '6379'), 10);
    const password = this.config.get<string>('REDIS_PASSWORD');

    this.client = createClient({
      socket: { host, port },
      password: password || undefined,
    });

    this.client.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[redis] error', err);
    });

    await this.client.connect();
  }

  async ping(): Promise<string> {
    if (!this.client) {
      await this.connect();
    }
    return this.client!.ping();
  }

  async get(key: string): Promise<string | null> {
    if (!this.isEnabled()) return null;
    if (!this.client) {
      await this.connect();
    }
    return this.client!.get(key);
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (!this.isEnabled()) return;
    if (!this.client) {
      await this.connect();
    }
    await this.client!.setEx(key, ttlSeconds, value);
  }

  async info(section?: string): Promise<string> {
    if (!this.isEnabled()) return '';
    if (!this.client) {
      await this.connect();
    }
    return this.client!.info(section);
  }
}
