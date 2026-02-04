import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Converstation } from '../../entities/conversation.entity';

@Injectable()
export class ConversacionesService {
  constructor(
    @InjectRepository(Converstation)
    private readonly repo: Repository<Converstation>,
  ) {}

  async getAll(from?: string, to?: string) {
    const qb = this.repo.createQueryBuilder('conversacion');

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      qb.where('conversacion.fecha_hora >= :fromDate', { fromDate })
        .andWhere('conversacion.fecha_hora <= :toDate', { toDate });
    }

    return qb.getMany();
  }
}
