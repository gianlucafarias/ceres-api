import { Injectable } from '@nestjs/common';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { ReclamosRepository } from './reclamos.repository';

@Injectable()
export class ReclamosStatsService {
  constructor(private readonly reclamosRepo: ReclamosRepository) {}

  countByEstado() {
    return this.reclamosRepo
      .createQueryBuilder('reclamo')
      .select('reclamo.estado', 'estado')
      .addSelect('COUNT(reclamo.id)', 'count')
      .groupBy('reclamo.estado')
      .getRawMany();
  }

  countByPrioridad() {
    return this.reclamosRepo
      .createQueryBuilder('reclamo')
      .select('reclamo.prioridad', 'prioridad')
      .addSelect('COUNT(reclamo.id)', 'count')
      .groupBy('reclamo.prioridad')
      .getRawMany();
  }

  countByTipo() {
    return this.reclamosRepo
      .createQueryBuilder('reclamo')
      .select('reclamo.reclamo', 'tipo')
      .addSelect('COUNT(reclamo.id)', 'count')
      .groupBy('reclamo.reclamo')
      .getRawMany();
  }

  countByBarrio() {
    const normalizedBarrio =
      "TRIM(REPLACE(LOWER(reclamo.barrio), 'barrio ', ''))";
    return this.reclamosRepo
      .createQueryBuilder('reclamo')
      .select(normalizedBarrio, 'barrio')
      .addSelect('COUNT(reclamo.id)', 'count')
      .groupBy(normalizedBarrio)
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  async statsBasicas() {
    const [countsByEstado, countsByPrioridad, countsByTipo] = await Promise.all(
      [this.countByEstado(), this.countByPrioridad(), this.countByTipo()],
    );

    return {
      countsByEstado,
      countsByPrioridad,
      countsByTipo,
    };
  }

  async statsAvanzadas() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const reclamosPorMes = await this.reclamosRepo
      .createQueryBuilder('reclamo')
      .select("DATE_TRUNC('month', reclamo.fecha)", 'mes')
      .addSelect('COUNT(reclamo.id)', 'cantidad')
      .where('reclamo.fecha >= :sixMonthsAgo', { sixMonthsAgo })
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany<{ mes: string; cantidad: string }>();

    const tiempoResolucion = await this.reclamosRepo
      .createQueryBuilder('reclamo')
      .select(
        'AVG(EXTRACT(EPOCH FROM (h2.fecha - h1.fecha)) / 86400)',
        'promedioDias',
      )
      .innerJoin(
        ReclamoHistorial,
        'h1',
        "h1.reclamo_id = reclamo.id AND h1.tipo = 'CREACION'",
      )
      .innerJoin(
        ReclamoHistorial,
        'h2',
        "h2.reclamo_id = reclamo.id AND h2.tipo = 'ESTADO' AND h2.valor_nuevo = 'COMPLETADO'",
      )
      .getRawOne<{ promedioDias: string | null }>();

    const eficienciaCuadrilla = await this.reclamosRepo
      .createQueryBuilder('reclamo')
      .select('reclamo.cuadrillaid', 'cuadrillaId')
      .addSelect('COUNT(reclamo.id)', 'reclamosResueltos')
      .where("reclamo.estado = 'COMPLETADO'")
      .andWhere('reclamo.cuadrillaid IS NOT NULL')
      .groupBy('reclamo.cuadrillaid')
      .orderBy('reclamosResueltos', 'DESC')
      .getRawMany<{ cuadrillaId: number; reclamosResueltos: string }>();

    return {
      reclamosPorMes,
      tiempoPromedioResolucion: Number(tiempoResolucion?.promedioDias ?? 0),
      eficienciaCuadrilla,
    };
  }
}
