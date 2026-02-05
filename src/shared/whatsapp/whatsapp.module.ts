import { Module } from '@nestjs/common';
import { WhatsappTemplateService } from './whatsapp-template.service';

@Module({
  providers: [WhatsappTemplateService],
  exports: [WhatsappTemplateService],
})
export class WhatsappModule {}
