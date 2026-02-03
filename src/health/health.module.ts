import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { RedisModule } from '../shared/redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([]), RedisModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
