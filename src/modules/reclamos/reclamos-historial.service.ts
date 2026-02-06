import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';

type HistorialTipo = 'CREACION' | 'ESTADO' | 'PRIORIDAD' | 'CUADRILLA';

interface HistorialChange {
  reclamoId: number;
  tipo: HistorialTipo;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  usuarioId?: number | null;
  comentario?: string;
}

@Injectable()
export class ReclamosHistorialService {
  constructor(
    @InjectRepository(ReclamoHistorial)
    private readonly repo: Repository<ReclamoHistorial>,
  ) {}

  registrarCreacion(reclamoId: number): Promise<ReclamoHistorial> {
    return this.saveChange({
      reclamoId,
      tipo: 'CREACION',
      valorNuevo: 'PENDIENTE',
      comentario: 'Reclamo creado via bot',
    });
  }

  registrarCambioEstado(
    reclamoId: number,
    anterior: string | null,
    nuevo: string,
    usuarioId?: number | null,
  ) {
    return this.saveChange({
      reclamoId,
      tipo: 'ESTADO',
      valorAnterior: anterior ?? null,
      valorNuevo: nuevo,
      usuarioId,
      comentario: 'Cambio de estado',
    });
  }

  registrarCambioPrioridad(
    reclamoId: number,
    anterior: string | null,
    nuevo: string,
    usuarioId?: number | null,
  ) {
    return this.saveChange({
      reclamoId,
      tipo: 'PRIORIDAD',
      valorAnterior: anterior ?? null,
      valorNuevo: nuevo,
      usuarioId,
      comentario: 'Cambio de prioridad',
    });
  }

  registrarCambioCuadrilla(
    reclamoId: number,
    anterior: number | null,
    nuevo: number | null,
    usuarioId?: number | null,
  ) {
    return this.saveChange({
      reclamoId,
      tipo: 'CUADRILLA',
      valorAnterior: anterior?.toString() ?? 'Sin cuadrilla',
      valorNuevo: nuevo?.toString() ?? 'Sin cuadrilla',
      usuarioId,
      comentario: 'Cambio de cuadrilla',
    });
  }

  listarPorReclamo(reclamoId: number): Promise<ReclamoHistorial[]> {
    return this.repo
      .createQueryBuilder('historial')
      .where('historial.reclamo_id = :id', { id: reclamoId })
      .orderBy('historial.fecha', 'ASC')
      .getMany();
  }

  private saveChange(change: HistorialChange): Promise<ReclamoHistorial> {
    const entity = this.repo.create({
      reclamoId: change.reclamoId,
      tipo: change.tipo,
      valorAnterior: change.valorAnterior,
      valorNuevo: change.valorNuevo,
      usuarioId: change.usuarioId ?? null,
      comentario: change.comentario,
    });

    return this.repo.save(entity);
  }
}
