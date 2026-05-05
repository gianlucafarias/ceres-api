import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { HttpClient } from '../../shared/http/http-client.service';
import {
  ContactHistoryQueryDto,
  ConversationDetailsQueryDto,
  ConversationIdParamDto,
  DateRangeQueryDto,
  HumanHandoffDto,
  SendHumanMessageDto,
} from './dto/history.dto';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectRepository(History)
    private readonly historyRepo: Repository<History>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    private readonly http: HttpClient,
    private readonly config: ConfigService,
  ) {}

  async getLastDayInteractions(limit = 10) {
    return this.historyRepo
      .createQueryBuilder()
      .where("created_at >= CURRENT_DATE - INTERVAL '1 day'")
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getMessagesPerDay(days = 30) {
    const rows = await this.historyRepo
      .createQueryBuilder('history')
      .select('DATE(history.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'DESC')
      .limit(days)
      .getRawMany<{ date: string; count: string }>();
    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  async getConversationDetails(query: ConversationDetailsQueryDto) {
    const page = this.toPositiveInt(query.page, 1);
    const limit = this.toPositiveInt(query.limit, 10);
    const contactId = this.toPositiveInt(query.contactId, 0);
    const conversationId =
      typeof query.conversationId === 'string'
        ? query.conversationId.trim()
        : '';

    if (conversationId) {
      const messages = await this.historyRepo.find({
        where: { conversation_id: conversationId },
        order: { createdAt: 'ASC' },
      });
      if (!messages.length && !contactId) {
        return this.buildEmptyConversationDetails(page);
      }
      if (messages.length) {
        return {
          messages,
          totalMessages: messages.length,
          currentPage: 1,
          totalPages: 1,
        };
      }
    }

    if (!contactId) {
      return this.buildEmptyConversationDetails(page);
    }

    const skip = (page - 1) * limit;
    const [messages, totalMessages] = await this.historyRepo.findAndCount({
      where: { contact: { id: contactId } },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    if (!messages.length) {
      return this.buildEmptyConversationDetails(page);
    }

    const totalPages = Math.ceil(totalMessages / limit);
    return {
      messages: messages.reverse(),
      totalMessages,
      currentPage: page,
      totalPages,
    };
  }

  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const intValue = Math.trunc(parsed);
    if (intValue <= 0) return fallback;
    return intValue;
  }

  private buildEmptyConversationDetails(page: number) {
    return {
      messages: [],
      totalMessages: 0,
      currentPage: page,
      totalPages: 0,
    };
  }

  async getHistoryByPhone(query: ContactHistoryQueryDto) {
    const { phone, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const [items, total] = await this.historyRepo.findAndCount({
      where: { phone },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      items,
      total,
      page,
      pageSize: limit,
    };
  }

  async getInteractionsByDateRange(range: DateRangeQueryDto) {
    const { startDate, endDate } = range;
    return this.historyRepo
      .createQueryBuilder()
      .where('created_at >= :startDate AND created_at <= :endDate', {
        startDate,
        endDate,
      })
      .orderBy('created_at', 'DESC')
      .getMany();
  }

  async getAllInteractions() {
    return this.historyRepo
      .createQueryBuilder()
      .orderBy('created_at', 'DESC')
      .getMany();
  }

  async getInteractionsByConversationId({
    conversationId,
  }: ConversationIdParamDto) {
    return this.historyRepo.find({
      where: { conversation_id: conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendHumanMessage(dto: SendHumanMessageDto) {
    const contact = await this.contactRepo.findOne({
      where: { id: dto.contactId },
      select: { id: true, phone: true },
    });

    if (!contact || !contact.phone) {
      throw new NotFoundException('Contacto no encontrado o sin teléfono');
    }

    const number = contact.phone.trim();
    const message = dto.message.trim();
    const botBaseUrl =
      this.config.get<string>('BOT_BASE_URL')?.trim() ||
      this.config.get<string>('BOT_API_BASE_URL')?.trim() ||
      'https://api.ceres.gob.ar';
    const url = `${botBaseUrl.replace(/\/$/, '')}/v1/messages`;

    try {
      await this.http.post<string, { number: string; message: string }>(
        url,
        { number, message },
        { headers: { 'Content-Type': 'application/json' } },
      );

      this.logger.log(
        JSON.stringify({
          event: 'human_message_sent',
          contactId: contact.id,
          conversationId: dto.conversationId ?? null,
          phoneMasked: this.maskPhone(number),
          messageLength: message.length,
        }),
      );

      return {
        success: true,
        message: 'Mensaje enviado correctamente',
      };
    } catch (error) {
      const statusCode = this.extractStatusCode(error);

      this.logger.error(
        JSON.stringify({
          event: 'human_message_send_failed',
          contactId: contact.id,
          conversationId: dto.conversationId ?? null,
          phoneMasked: this.maskPhone(number),
          messageLength: message.length,
          statusCode,
          error: error instanceof Error ? error.message : String(error),
        }),
      );

      throw new BadGatewayException(
        'No se pudo enviar el mensaje al proveedor de bot',
      );
    }
  }

  async humanHandoff(dto: HumanHandoffDto) {
    const contact = await this.contactRepo.findOne({
      where: { id: dto.contactId },
      select: { id: true, phone: true },
    });

    if (!contact || !contact.phone) {
      throw new NotFoundException('Contacto no encontrado o sin teléfono');
    }

    const number = contact.phone.trim();
    const botBaseUrl =
      this.config.get<string>('BOT_BASE_URL')?.trim() ||
      this.config.get<string>('BOT_API_BASE_URL')?.trim() ||
      'https://api.ceres.gob.ar';
    const url = `${botBaseUrl.replace(/\/$/, '')}/v1/blacklist`;
    const intent = dto.action === 'take' ? 'add' : 'remove';

    try {
      await this.http.post<
        { status?: string; number?: string; intent?: string },
        { number: string; intent: 'add' | 'remove' }
      >(
        url,
        { number, intent },
        { headers: { 'Content-Type': 'application/json' } },
      );

      this.logger.log(
        JSON.stringify({
          event: 'human_handoff_updated',
          action: dto.action,
          contactId: contact.id,
          conversationId: dto.conversationId ?? null,
          phoneMasked: this.maskPhone(number),
        }),
      );

      return {
        success: true,
        mode: dto.action === 'take' ? 'human' : 'bot',
        message:
          dto.action === 'take'
            ? 'Conversación tomada por humano'
            : 'Conversación devuelta al bot',
      };
    } catch (error) {
      const statusCode = this.extractStatusCode(error);
      this.logger.error(
        JSON.stringify({
          event: 'human_handoff_update_failed',
          action: dto.action,
          contactId: contact.id,
          conversationId: dto.conversationId ?? null,
          phoneMasked: this.maskPhone(number),
          statusCode,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      throw new BadGatewayException(
        'No se pudo actualizar el estado de handoff en el bot',
      );
    }
  }

  private maskPhone(phone: string): string {
    const normalized = phone.trim();
    if (normalized.length <= 4) return '****';
    return `****${normalized.slice(-4)}`;
  }

  private extractStatusCode(error: unknown): number | null {
    if (!error || typeof error !== 'object' || !('response' in error)) {
      return null;
    }

    const response = (error as { response?: { status?: unknown } }).response;
    if (!response || typeof response.status !== 'number') {
      return null;
    }

    return response.status;
  }
}
