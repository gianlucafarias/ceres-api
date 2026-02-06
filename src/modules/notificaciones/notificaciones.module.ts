import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { Notificaciones } from '../../entities/notificaciones.entity';
import { PreferenciasUsuario } from '../../entities/preferencias-usuario.entity';
import { WhatsappModule } from '../../shared/whatsapp/whatsapp.module';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact, PreferenciasUsuario, Notificaciones]),
    WhatsappModule,
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
})
export class NotificacionesModule {}
