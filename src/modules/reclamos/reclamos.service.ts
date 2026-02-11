import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Reclamo } from '../../entities/reclamo.entity';
import { CrearReclamoBotDto } from './dto/reclamos-bot.dto';
import {
  ActualizarReclamoAdminDto,
  ReclamosFiltroAdminDto,
} from './dto/reclamos-admin.dto';
import { GeocodeService } from '../../shared/geocode/geocode.service';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';
import { ReclamosHistorialService } from './reclamos-historial.service';
import { ReclamosRepository } from './reclamos.repository';
import { ReclamosStatsService } from './reclamos-stats.service';

type ReclamoSafe = Omit<Reclamo, 'telefono'> & { telefono?: string };
type ReclamoTipoBot = { id: number; nombre: string };
type ReclamoRelacionadoAdmin = Pick<
  Reclamo,
  'id' | 'fecha' | 'reclamo' | 'estado' | 'barrio' | 'ubicacion' | 'detalle'
>;

@Injectable()
export class ReclamosService {
  private readonly logger = new Logger(ReclamosService.name);

  constructor(
    private readonly reclamosRepo: ReclamosRepository,
    private readonly historialService: ReclamosHistorialService,
    private readonly statsService: ReclamosStatsService,
    private readonly geocodeService: GeocodeService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // --- Bot ---
  async crearDesdeBot(dto: CrearReclamoBotDto): Promise<ReclamoSafe> {
    let coords = { latitud: 0, longitud: 0 };
    try {
      coords = await this.geocodeService.geocodeAddress(dto.ubicacion);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`Geocode error: ${message}`);
    }

    const entity = this.reclamosRepo.create({
      ...dto,
      estado: 'PENDIENTE',
      fecha: new Date(),
      latitud: coords.latitud,
      longitud: coords.longitud,
    });
    const saved = await this.reclamosRepo.save(entity);

    await this.historialService.registrarCreacion(saved.id);
    await this.logCreacion(saved);

    return this.toBotDto(saved);
  }

  async estadoParaBot(id: number): Promise<ReclamoSafe | null> {
    const rec = await this.reclamosRepo.findById(id);
    return rec ? this.toBotDto(rec) : null;
  }

  async tiposParaBot(): Promise<ReclamoTipoBot[]> {
    const tipos = await this.reclamosRepo.findDistinctTipos();
    return tipos.map((nombre, index) => ({
      id: index + 1,
      nombre,
    }));
  }

  async ultimoPorTelefonoParaBot(
    telefono: string,
  ): Promise<ReclamoSafe | null> {
    const rec = await this.reclamosRepo.findLatestByTelefono(telefono);
    return rec ? this.toBotDto(rec) : null;
  }

  // --- Admin ---
  async listarAdmin(filters: ReclamosFiltroAdminDto) {
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 10;

    const [data, total] = await this.reclamosRepo.findAndCountForAdmin(filters);

    return {
      data,
      total,
      pageCount: Math.ceil(total / perPage),
      currentPage: page,
    };
  }

  async detalleAdmin(id: number) {
    return this.reclamosRepo.findById(id);
  }

  async relacionadosAdmin(
    id: number,
  ): Promise<{ data: ReclamoRelacionadoAdmin[]; total: number }> {
    const current = await this.reclamosRepo.findById(id);
    if (!current) {
      throw new NotFoundException(`Reclamo con id ${id} no encontrado`);
    }

    const sameApplicant = await this.reclamosPorTelefono(current.telefono);
    const data = sameApplicant
      .filter((item) => item.id !== id)
      .map((item) => this.toRelacionadoAdminDto(item));

    return {
      data,
      total: data.length,
    };
  }

  async actualizarAdmin(id: number, dto: ActualizarReclamoAdminDto) {
    const rec = await this.reclamosRepo.findById(id);
    if (!rec) return null;

    const prevEstado = rec.estado;
    const prevPrioridad = rec.prioridad;
    const prevCuadrilla = rec.cuadrillaid;
    const ubicacionCambiada =
      dto.ubicacion !== undefined && dto.ubicacion !== rec.ubicacion;

    if (dto.nombre !== undefined) rec.nombre = dto.nombre;
    if (dto.telefono !== undefined) rec.telefono = dto.telefono;
    if (dto.reclamo !== undefined) rec.reclamo = dto.reclamo;
    if (dto.ubicacion !== undefined) rec.ubicacion = dto.ubicacion;
    if (dto.barrio !== undefined) rec.barrio = dto.barrio;
    if (dto.detalle !== undefined) rec.detalle = dto.detalle;
    if (dto.estado !== undefined) rec.estado = dto.estado;
    if (dto.prioridad !== undefined) rec.prioridad = dto.prioridad;
    if (dto.cuadrillaId !== undefined) rec.cuadrillaid = dto.cuadrillaId;

    if (ubicacionCambiada) {
      try {
        const coords = await this.geocodeService.geocodeAddress(
          dto.ubicacion ?? rec.ubicacion,
        );
        rec.latitud = coords.latitud;
        rec.longitud = coords.longitud;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        this.logger.warn(`Geocode error: ${message}`);
      }
    }

    const saved = await this.reclamosRepo.save(rec);

    // Historial
    if (dto.estado !== undefined && dto.estado !== prevEstado) {
      await this.historialService.registrarCambioEstado(
        id,
        prevEstado ?? null,
        dto.estado,
        dto.usuarioId,
      );
      await this.logCambioEstado(
        saved,
        prevEstado ?? null,
        dto.estado,
        dto.usuarioId,
      );
    }
    if (dto.prioridad !== undefined && dto.prioridad !== prevPrioridad) {
      await this.historialService.registrarCambioPrioridad(
        id,
        prevPrioridad ?? null,
        dto.prioridad,
        dto.usuarioId,
      );
    }
    if (dto.cuadrillaId !== undefined && dto.cuadrillaId !== prevCuadrilla) {
      await this.historialService.registrarCambioCuadrilla(
        id,
        prevCuadrilla ?? null,
        dto.cuadrillaId,
        dto.usuarioId,
      );
    }

    return saved;
  }

  async historialAdmin(id: number) {
    return this.historialService.listarPorReclamo(id);
  }

  async countByEstado() {
    return this.statsService.countByEstado();
  }

  async countByPrioridad() {
    return this.statsService.countByPrioridad();
  }

  async countByTipo() {
    return this.statsService.countByTipo();
  }

  async countByBarrio() {
    return this.statsService.countByBarrio();
  }

  async statsBasicas() {
    return this.statsService.statsBasicas();
  }

  async statsAvanzadas() {
    return this.statsService.statsAvanzadas();
  }

  async reclamosPorTelefono(telefono: string) {
    return this.reclamosRepo.findByTelefono(telefono);
  }

  // --- helpers ---
  private toBotDto(rec: Reclamo): ReclamoSafe {
    const safe: ReclamoSafe = { ...rec };
    delete safe.telefono;
    return safe;
  }

  private toRelacionadoAdminDto(rec: Reclamo): ReclamoRelacionadoAdmin {
    return {
      id: rec.id,
      fecha: rec.fecha,
      reclamo: rec.reclamo,
      estado: rec.estado,
      barrio: rec.barrio,
      ubicacion: rec.ubicacion,
      detalle: rec.detalle,
    };
  }

  private async logCreacion(reclamo: Reclamo): Promise<void> {
    try {
      await this.activityLog.logActivity({
        type: 'RECLAMO',
        action: 'CREACION',
        description: `Nuevo reclamo registrado - ${reclamo.reclamo}`,
        entityId: reclamo.id,
        metadata: {
          ubicacion: reclamo.ubicacion,
          barrio: reclamo.barrio,
          prioridad: reclamo.prioridad,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`Activity log error: ${message}`);
    }
  }

  private async logCambioEstado(
    reclamo: Reclamo,
    estadoAnterior: string | null,
    estadoNuevo: string,
    usuarioId?: number | null,
  ): Promise<void> {
    try {
      await this.activityLog.logActivity({
        type: 'RECLAMO',
        action: 'ESTADO_CAMBIADO',
        description: `Reclamo #${reclamo.id} - Cambio de estado: ${estadoAnterior ?? 'N/A'} -> ${estadoNuevo}`,
        entityId: reclamo.id,
        userId: usuarioId ?? undefined,
        metadata: {
          estadoAnterior: estadoAnterior ?? null,
          estadoNuevo,
          ubicacion: reclamo.ubicacion,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`Activity log error: ${message}`);
    }
  }
}
