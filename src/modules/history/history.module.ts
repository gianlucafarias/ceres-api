import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [TypeOrmModule.forFeature([History, Contact])],
  controllers: [HistoryController],
  providers: [HistoryService, AdminApiKeyGuard],
})
export class HistoryModule {}
