import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import {
  ContactHistoryQueryDto,
  ConversationDetailsQueryDto,
  ConversationIdParamDto,
  DateRangeQueryDto,
} from './dto/history.dto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepo: Repository<History>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
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
    const { contactId, conversationId, page = 1, limit = 10 } = query;
    if (conversationId) {
      const messages = await this.historyRepo.find({
        where: { conversation_id: conversationId },
        order: { createdAt: 'ASC' },
      });
      if (!messages.length) return null;
      return {
        messages,
        totalMessages: messages.length,
        currentPage: 1,
        totalPages: 1,
      };
    }

    if (!contactId) return null;
    const skip = (page - 1) * limit;
    const [messages, totalMessages] = await this.historyRepo.findAndCount({
      where: { contact: { id: contactId } },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalMessages / limit);
    return {
      messages: messages.reverse(),
      totalMessages,
      currentPage: page,
      totalPages,
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
}
