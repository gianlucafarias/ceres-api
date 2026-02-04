import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Converstation } from '../../entities/conversation.entity';
import { Flow } from '../../entities/flow.entity';
import { VisitsRangeQueryDto } from './dto/visits.dto';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Flow)
    private readonly flowRepo: Repository<Flow>,
    @InjectRepository(Converstation)
    private readonly conversationRepo: Repository<Converstation>,
  ) {}

  async getVisitasFlujo(query: VisitsRangeQueryDto) {
    const { from, to } = query;

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      const flujos = await this.flowRepo.find();

      const visitasFlujo = await Promise.all(
        flujos.map(async (flujo) => {
          const count = await this.conversationRepo
            .createQueryBuilder('conversacion')
            .where('conversacion.ultimo_flujo = :nombreFlujo', {
              nombreFlujo: flujo.nombre_flujo,
            })
            .andWhere('conversacion.fecha_hora >= :fromDate', { fromDate })
            .andWhere('conversacion.fecha_hora <= :toDate', { toDate })
            .getCount();

          return {
            id: flujo.id,
            nombre_flujo: flujo.nombre_flujo,
            contador: count,
          };
        }),
      );

      const totalVisitas = visitasFlujo.reduce((acc, f) => acc + f.contador, 0);
      return { visitasFlujo, totalVisitas };
    }

    const visitasFlujo = await this.flowRepo.find();
    const totalVisitas = visitasFlujo.reduce((acc, f) => acc + f.contador, 0);
    return { visitasFlujo, totalVisitas };
  }
}
