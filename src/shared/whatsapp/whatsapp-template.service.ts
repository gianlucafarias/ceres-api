import { Injectable } from '@nestjs/common';
import { HttpClient } from '../http/http-client.service';
import { WhatsappTemplatePayload } from './whatsapp.types';

@Injectable()
export class WhatsappTemplateService {
  private readonly url = 'https://api.ceres.gob.ar/v1/template';

  constructor(private readonly http: HttpClient) {}

  async sendTemplate(payload: WhatsappTemplatePayload): Promise<void> {
    await this.http.post<void, WhatsappTemplatePayload>(this.url, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
