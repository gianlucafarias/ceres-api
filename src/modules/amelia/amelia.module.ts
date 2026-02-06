import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmeliaTurno } from '../../entities/amelia-turno.entity';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module';
import { WhatsappModule } from '../../shared/whatsapp/whatsapp.module';
import { AmeliaController } from './amelia.controller';
import { AmeliaWebhookParser } from './amelia-webhook.parser';
import { AmeliaService } from './amelia.service';
import { AmeliaTurnoService } from './amelia-turno.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AmeliaTurno]),
    ActivityLogModule,
    WhatsappModule,
  ],
  controllers: [AmeliaController],
  providers: [AmeliaWebhookParser, AmeliaTurnoService, AmeliaService],
})
export class AmeliaModule {}
