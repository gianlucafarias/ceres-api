import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../entities/contact.entity';
import { UsersCountQueryDto } from './dto/users-count.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async getUsersCount({
    from,
    to,
  }: UsersCountQueryDto): Promise<{ count: number }> {
    const qb = this.contactRepo.createQueryBuilder('contact');

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      qb.where('contact.created_at >= :fromDate', { fromDate }).andWhere(
        'contact.created_at <= :toDate',
        { toDate },
      );
    }

    const count = await qb.getCount();
    return { count };
  }
}
