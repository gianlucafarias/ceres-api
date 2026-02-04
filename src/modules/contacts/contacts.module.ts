import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { Converstation } from '../../entities/conversation.entity';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, History, Reclamo, Converstation])],
  controllers: [ContactsController],
  providers: [ContactsService, AdminApiKeyGuard],
})
export class ContactsModule {}
