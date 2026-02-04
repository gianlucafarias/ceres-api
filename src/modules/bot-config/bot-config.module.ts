import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotConfig } from '../../entities/bot-config.entity';
import { BotConfigController } from './bot-config.controller';
import { BotConfigService } from './bot-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([BotConfig])],
  controllers: [BotConfigController],
  providers: [BotConfigService],
})
export class BotConfigModule {}
