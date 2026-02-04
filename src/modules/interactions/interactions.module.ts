import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History } from '../../entities/history.entity';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([History])],
  controllers: [InteractionsController],
  providers: [InteractionsService, AdminApiKeyGuard],
})
export class InteractionsModule {}
