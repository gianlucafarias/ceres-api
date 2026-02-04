import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { Converstation } from '../../entities/conversation.entity';
import { Flow } from '../../entities/flow.entity';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Flow, Converstation])],
  controllers: [VisitsController],
  providers: [VisitsService, AdminApiKeyGuard],
})
export class VisitsModule {}
