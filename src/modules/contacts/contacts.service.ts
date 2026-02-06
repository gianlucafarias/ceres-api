import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository } from 'typeorm';
import { Contact } from '../../entities/contact.entity';
import { History } from '../../entities/history.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { Converstation } from '../../entities/conversation.entity';
import {
  ContactsQueryDto,
  ConversationsRangeQueryDto,
} from './dto/contacts.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(History)
    private readonly historyRepo: Repository<History>,
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    @InjectRepository(Converstation)
    private readonly conversationRepo: Repository<Converstation>,
  ) {}

  async getLastUserInteractions(limit = 50) {
    const contacts = await this.contactRepo
      .createQueryBuilder('contact')
      .where('contact.last_interaction IS NOT NULL')
      .orderBy('contact.last_interaction', 'DESC')
      .limit(limit)
      .getMany();

    const withLastInteraction = await Promise.all(
      contacts.map(async (contact) => {
        const lastHistory = await this.historyRepo
          .createQueryBuilder('history')
          .where('history.contact_id = :contactId', { contactId: contact.id })
          .orderBy('history.created_at', 'DESC')
          .limit(1)
          .getOne();

        return {
          id: contact.id,
          phone: contact.phone,
          contact_name: contact.contact_name,
          lastInteraction: contact.lastInteraction,
          lastMessage: lastHistory
            ? {
                keyword: lastHistory.keyword,
                answer: lastHistory.answer,
                createdAt: lastHistory.createdAt,
                conversation_id: lastHistory.conversation_id,
              }
            : null,
          values: contact.values,
        };
      }),
    );

    return withLastInteraction;
  }

  async getContacts(query: ContactsQueryDto) {
    const { sort = 'createdAt', order = 'DESC' } = query;
    const sortField: ContactsQueryDto['sort'] = sort ?? 'createdAt';
    const orderBy: FindOptionsOrder<Contact> = {
      [sortField]: order ?? 'DESC',
    };
    const contacts = await this.contactRepo.find({
      order: orderBy,
    });
    return contacts;
  }

  async getContactDetailsById(id: number) {
    const contact = await this.contactRepo.findOne({ where: { id } });
    if (!contact) return null;

    const reclamos = await this.reclamoRepo.find({
      where: { telefono: contact.phone },
      order: { fecha: 'DESC' },
    });

    const historyCountByContactId = await this.historyRepo.count({
      where: { contact: { id } },
    });
    const historyCountByPhone = await this.historyRepo.count({
      where: { phone: contact.phone },
    });

    return {
      ...contact,
      reclamos,
      historyStats: {
        countByContactId: historyCountByContactId,
        countByPhone: historyCountByPhone,
      },
    };
  }

  async getContactConversations(
    id: number,
    { from, to }: ConversationsRangeQueryDto,
  ) {
    const qb = this.conversationRepo
      .createQueryBuilder('conversacion')
      .where('conversacion.contact_id = :id', { id });

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      qb.andWhere('conversacion.fecha_hora >= :fromDate', {
        fromDate,
      }).andWhere('conversacion.fecha_hora <= :toDate', { toDate });
    }

    qb.orderBy('conversacion.fecha_hora', 'DESC');
    return qb.getMany();
  }
}
