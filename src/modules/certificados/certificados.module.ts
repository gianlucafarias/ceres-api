import { Module } from '@nestjs/common';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { CertificadosController } from './certificados.controller';
import { CertificadosService } from './certificados.service';

@Module({
  controllers: [CertificadosController],
  providers: [CertificadosService, BotApiKeyGuard],
})
export class CertificadosModule {}
