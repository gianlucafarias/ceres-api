import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { History } from '../../entities/history.entity';
import {
  InteractionsCountQueryDto,
  InteractionsGroupParamsDto,
  InteractionsRangeParamsDto,
} from './dto/interactions.dto';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepo: Repository<History>,
  ) {}

  async getInteractionsLastWeek(params: InteractionsGroupParamsDto) {
    const { start_date, end_date, group_by } = params;
    const groupExpr = this.groupSelect(group_by);
    const qb = this.historyRepo
      .createQueryBuilder('history')
      .select(groupExpr, 'group_key')
      .addSelect('COUNT(*)', 'count')
      .where('history.created_at >= :startDate', { startDate: start_date })
      .andWhere('history.created_at <= :endDate', { endDate: end_date })
      .groupBy(groupExpr)
      .orderBy(groupExpr, 'ASC');

    const rows = await qb.getRawMany();
    return rows.map((r) => ({ group: r.group_key, count: Number(r.count) }));
  }

  async getInteractionsToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    const count = await this.historyRepo
      .createQueryBuilder()
      .where('created_at >= :today', { today })
      .andWhere('created_at <= :now', { now })
      .getCount();
    return { count };
  }

  async getInteractionsCountByDateRange(params: InteractionsRangeParamsDto) {
    const { start_date, end_date } = params;
    const count = await this.historyRepo
      .createQueryBuilder()
      .where('created_at >= :start', { start: start_date })
      .andWhere('created_at <= :end', { end: end_date })
      .getCount();
    return { count };
  }

  async getInteractionsCount(query: InteractionsCountQueryDto) {
    const { from, to } = query;
    if (!from || !to) {
      const count = await this.historyRepo.count();
      return { count };
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    const count = await this.historyRepo.count({
      where: { createdAt: Between(fromDate, toDate) },
    });
    return { count };
  }

  private groupSelect(group_by: 'day' | 'hour' | 'keyword') {
    switch (group_by) {
      case 'hour':
        return "to_char(history.created_at, 'YYYY-MM-DD HH24:00')";
      case 'keyword':
        return 'history.keyword';
      case 'day':
      default:
        return "to_char(history.created_at, 'YYYY-MM-DD')";
    }
  }
}
