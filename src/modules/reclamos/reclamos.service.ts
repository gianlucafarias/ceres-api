import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { CrearReclamoBotDto } from './dto/reclamos-bot.dto';
import { ActualizarReclamoAdminDto, ReclamosFiltroAdminDto } from './dto/reclamos-admin.dto';
import { geocodeAddress } from '../../services/geocodeAdress';

type ReclamoSafe = Omit<Reclamo, 'telefono'> & { telefono?: string };

@Injectable()
export class ReclamosService {
  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    @InjectRepository(ReclamoHistorial)
    private readonly historialRepo: Repository<ReclamoHistorial>,
  ) {}

  // --- Bot ---
  async crearDesdeBot(dto: CrearReclamoBotDto): Promise<ReclamoSafe> {
    let coords = { latitud: 0, longitud: 0 };
    try {
      coords = await geocodeAddress(dto.ubicacion);
    } catch (err) {
      // log but continue
      // eslint-disable-next-line no-console
      console.error('Geocode error', err);
    }

    const entity = this.reclamoRepo.create({
      ...dto,
      estado: 'PENDIENTE',
      fecha: new Date(),
      latitud: coords.latitud,
      longitud: coords.longitud,
    });
    const saved = await this.reclamoRepo.save(entity);

    await this.historialRepo.save(
      this.historialRepo.create({
        reclamoId: saved.id,
        tipo: 'CREACION',
        valorNuevo: 'PENDIENTE',
        comentario: 'Reclamo creado via bot',
      }),
    );

    return this.toBotDto(saved);
  }

  async estadoParaBot(id: number): Promise<ReclamoSafe | null> {
    const rec = await this.reclamoRepo.findOne({ where: { id } });
    return rec ? this.toBotDto(rec) : null;
  }

  // --- Admin ---
  async listarAdmin(filters: ReclamosFiltroAdminDto) {
    const {
      page = 1,
      per_page = 10,
      estado,
      prioridad,
      barrio,
      search,
      from,
      to,
      sort = 'id',
      order = 'DESC',
    } = filters;

    const skip = (page - 1) * per_page;
    const where: any = {};
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (barrio) where.barrio = barrio;
    if (search) where.reclamo = Like(`%${search}%`);
    if (from && to) where.fecha = Between(new Date(from), endOfDay(to));
    else if (from) where.fecha = Between(new Date(from), new Date());
    else if (to) where.fecha = Between(new Date(0), endOfDay(to));

    const [data, total] = await this.reclamoRepo.findAndCount({
      where,
      skip,
      take: per_page,
      order: { [sort]: order as 'ASC' | 'DESC' },
    });

    return {
      data,
      total,
      pageCount: Math.ceil(total / per_page),
      currentPage: page,
    };
  }

  async detalleAdmin(id: number) {
    return this.reclamoRepo.findOne({ where: { id } });
  }

  async actualizarAdmin(id: number, dto: ActualizarReclamoAdminDto) {
    const rec = await this.reclamoRepo.findOne({ where: { id } });
    if (!rec) return null;

    const prevEstado = rec.estado;
    const prevPrioridad = rec.prioridad;
    const prevCuadrilla = rec.cuadrillaid;
    const ubicacionCambiada = dto.ubicacion && dto.ubicacion !== rec.ubicacion;

    Object.assign(rec, dto);

    if (ubicacionCambiada) {
      try {
        const coords = await geocodeAddress(dto.ubicacion!);
        rec.latitud = coords.latitud;
        rec.longitud = coords.longitud;
      } catch (err) {
        console.error('Geocode error', err);
      }
    }

    const saved = await this.reclamoRepo.save(rec);

    // Historial
    if (dto.estado && dto.estado !== prevEstado) {
      await this.historialRepo.save(
        this.historialRepo.create({
          reclamoId: id,
          tipo: 'ESTADO',
          valorAnterior: prevEstado,
          valorNuevo: dto.estado,
          usuarioId: dto.usuarioId ?? null,
          comentario: 'Cambio de estado',
        }),
      );
    }
    if (dto.prioridad && dto.prioridad !== prevPrioridad) {
      await this.historialRepo.save(
        this.historialRepo.create({
          reclamoId: id,
          tipo: 'PRIORIDAD',
          valorAnterior: prevPrioridad,
          valorNuevo: dto.prioridad,
          usuarioId: dto.usuarioId ?? null,
          comentario: 'Cambio de prioridad',
        }),
      );
    }
    if (dto.cuadrillaId !== undefined && dto.cuadrillaId !== prevCuadrilla) {
      await this.historialRepo.save(
        this.historialRepo.create({
          reclamoId: id,
          tipo: 'CUADRILLA',
          valorAnterior: prevCuadrilla?.toString() ?? 'Sin cuadrilla',
          valorNuevo: dto.cuadrillaId?.toString() ?? 'Sin cuadrilla',
          usuarioId: dto.usuarioId ?? null,
          comentario: 'Cambio de cuadrilla',
        }),
      );
    }

    return saved;
  }

  async historialAdmin(id: number) {
    return this.historialRepo
      .createQueryBuilder('historial')
      .where('historial.reclamo_id = :id', { id })
      .orderBy('historial.fecha', 'ASC')
      .getMany();
  }

  async statsBasicas() {
    const repo = this.reclamoRepo;
    const countsByEstado = await repo
      .createQueryBuilder('reclamo')
      .select('reclamo.estado', 'estado')
      .addSelect('COUNT(reclamo.id)', 'count')
      .groupBy('reclamo.estado')
      .getRawMany();

    const countsByPrioridad = await repo
      .createQueryBuilder('reclamo')
      .select('reclamo.prioridad', 'prioridad')
      .addSelect('COUNT(reclamo.id)', 'count')
      .groupBy('reclamo.prioridad')
      .getRawMany();

    const countsByTipo = await repo
      .createQueryBuilder('reclamo')
      .select('reclamo.reclamo', 'tipo')
      .addSelect('COUNT(reclamo.id)', 'count')
      .groupBy('reclamo.reclamo')
      .getRawMany();

    return {
      countsByEstado,
      countsByPrioridad,
      countsByTipo,
    };
  }

  async reclamosPorTelefono(telefono: string) {
    return this.reclamoRepo.find({
      where: { telefono },
      order: { fecha: 'DESC' },
    });
  }

  // --- helpers ---
  private toBotDto(rec: Reclamo): ReclamoSafe {
    const { telefono, ...rest } = rec;
    return rest;
  }
}

function endOfDay(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}
