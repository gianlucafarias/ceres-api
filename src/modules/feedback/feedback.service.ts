import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../../entities/feedback.entity';

type FeedbackRow = {
  id: number | string;
  nombre: string | null;
  calificacion: string | null;
  comentario: string | null;
  timestamp: Date | string | null;
  conversation_id: string | null;
  contact_id: number | string | null;
};

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly repo: Repository<Feedback>,
  ) {}

  async getAll() {
    const rows = await this.repo
      .createQueryBuilder('feedback')
      .select('feedback.id', 'id')
      .addSelect('feedback.nombre', 'nombre')
      .addSelect('feedback.calificacion', 'calificacion')
      .addSelect('feedback.comentario', 'comentario')
      .addSelect('feedback.timestamp', 'timestamp')
      .addSelect('feedback.conversation_id', 'conversation_id')
      .addSelect('feedback.contact_id', 'contact_id')
      .orderBy('feedback.timestamp', 'DESC')
      .getRawMany<FeedbackRow>();

    return rows.map((row) => ({
      id: Number(row.id),
      nombre: row.nombre,
      calificacion: row.calificacion,
      comentario: row.comentario,
      timestamp: row.timestamp,
      conversation_id: row.conversation_id,
      contact_id: row.contact_id === null ? null : Number(row.contact_id),
    }));
  }
}
