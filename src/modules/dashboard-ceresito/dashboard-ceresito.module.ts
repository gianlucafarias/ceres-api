import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { Contact } from '../../entities/contact.entity';
import { Converstation } from '../../entities/conversation.entity';
import { History } from '../../entities/history.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { DashboardCeresitoController } from './dashboard-ceresito.controller';
import { DashboardCeresitoService } from './dashboard-ceresito.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact, Converstation, History, Reclamo]),
  ],
  controllers: [DashboardCeresitoController],
  providers: [DashboardCeresitoService, AdminApiKeyGuard],
})
export class DashboardCeresitoModule {}
