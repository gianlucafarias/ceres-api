import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Converstation } from '../../entities/conversation.entity';
import { ConversacionesController } from './conversaciones.controller';
import { ConversacionesService } from './conversaciones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Converstation])],
  controllers: [ConversacionesController],
  providers: [ConversacionesService],
})
export class ConversacionesModule {}
