import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncuestaPresupuesto } from '../../entities/encuesta-presupuesto.entity';
import { RedisService } from '../../shared/redis/redis.service';
import { GuardarEncuestaDto } from './dto/encuestas-public.dto';
import { EditarEncuestaDto, EncuestasQueryDto } from './dto/encuestas-admin.dto';

interface DniValidationResult {
  puedeContinuar: boolean;
  mensaje: string;
}

@Injectable()
export class EncuestasService {
  constructor(
    @InjectRepository(EncuestaPresupuesto)
    private readonly encuestaRepo: Repository<EncuestaPresupuesto>,
    private readonly redis: RedisService,
  ) {}

  async validarDni(rawDni: string): Promise<DniValidationResult> {
    const dni = normalizeDni(rawDni);
    if (dni.length < 7 || dni.length > 8) {
      throw new BadRequestException('El DNI debe tener entre 7 y 8 digitos');
    }

    const cacheKey = `encuesta:dni:${dni}`;
    const cached = await this.getCache<DniValidationResult>(cacheKey);
    if (cached) return cached;

    const existente = await this.encuestaRepo.findOne({ where: { dni } });
    const result: DniValidationResult = existente
      ? { puedeContinuar: false, mensaje: 'Ya completaste la encuesta anteriormente' }
      : { puedeContinuar: true, mensaje: 'DNI valido, puedes continuar' };

    await this.setCache(cacheKey, result, 3600);
    return result;
  }

  async guardarEncuesta(dto: GuardarEncuestaDto): Promise<EncuestaPresupuesto> {
    const dni = normalizeDni(dto.dni);

    const existente = await this.encuestaRepo.findOne({ where: { dni } });
    if (existente) {
      throw new ConflictException('Ya completaste la encuesta anteriormente');
    }

    const entity = this.encuestaRepo.create({
      dni,
      barrio: dto.barrio,
      obrasUrgentes: dto.obrasUrgentes,
      obrasUrgentesOtro: dto.obrasUrgentesOtro ?? null,
      serviciosMejorar: dto.serviciosMejorar,
      serviciosMejorarOtro: dto.serviciosMejorarOtro ?? null,
      espacioMejorar: dto.espacioMejorar ?? null,
      propuesta: dto.propuesta ?? null,
      quiereContacto: dto.quiereContacto,
      nombreCompleto: dto.nombreCompleto ?? null,
      telefono: dto.telefono ?? null,
      email: dto.email ?? null,
      estado: 'completada',
    });

    return this.encuestaRepo.save(entity);
  }

  async obtenerEstadoPublico(id: number) {
    const encuesta = await this.encuestaRepo.findOne({ where: { id } });
    if (!encuesta) return null;

    return {
      id: encuesta.id,
      procesada: true,
      timestamp: encuesta.fechaCreacion.getTime(),
      estado: encuesta.estado,
    };
  }

  async obtenerEncuesta(id: number) {
    return this.encuestaRepo.findOne({ where: { id } });
  }

  async editarEncuesta(id: number, dto: EditarEncuestaDto) {
    const encuesta = await this.encuestaRepo.findOne({ where: { id } });
    if (!encuesta) return null;

    if (dto.dni && dto.dni !== encuesta.dni) {
      const dni = normalizeDni(dto.dni);
      const existente = await this.encuestaRepo.findOne({ where: { dni } });
      if (existente) {
        throw new ConflictException('Ya existe una encuesta con este DNI');
      }
      encuesta.dni = dni;
    }

    Object.assign(encuesta, {
      barrio: dto.barrio ?? encuesta.barrio,
      obrasUrgentes: dto.obrasUrgentes ?? encuesta.obrasUrgentes,
      obrasUrgentesOtro: dto.obrasUrgentesOtro ?? encuesta.obrasUrgentesOtro,
      serviciosMejorar: dto.serviciosMejorar ?? encuesta.serviciosMejorar,
      serviciosMejorarOtro: dto.serviciosMejorarOtro ?? encuesta.serviciosMejorarOtro,
      espacioMejorar: dto.espacioMejorar ?? encuesta.espacioMejorar,
      propuesta: dto.propuesta ?? encuesta.propuesta,
      quiereContacto: dto.quiereContacto ?? encuesta.quiereContacto,
      nombreCompleto: dto.nombreCompleto ?? encuesta.nombreCompleto,
      telefono: dto.telefono ?? encuesta.telefono,
      email: dto.email ?? encuesta.email,
    });

    return this.encuestaRepo.save(encuesta);
  }

  async eliminarEncuesta(id: number): Promise<boolean> {
    const result = await this.encuestaRepo.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async obtenerPorBarrio(barrio: string) {
    return this.encuestaRepo.find({
      where: { barrio },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async obtenerTodas(query: EncuestasQueryDto) {
    const {
      page = 1,
      per_page = 10,
      sort = 'id',
      order = 'DESC',
      barrio,
      estado,
      desde,
      hasta,
      search,
    } = query;

    const qb = this.encuestaRepo.createQueryBuilder('encuesta');

    if (barrio && barrio !== 'todos') {
      qb.andWhere('encuesta.barrio = :barrio', { barrio });
    }

    if (estado) {
      qb.andWhere('encuesta.estado = :estado', { estado });
    }

    if (desde) {
      qb.andWhere('encuesta.fechaCreacion >= :desde', { desde: new Date(desde) });
    }

    if (hasta) {
      qb.andWhere('encuesta.fechaCreacion <= :hasta', { hasta: endOfDay(hasta) });
    }

    if (search) {
      qb.andWhere(
        '(encuesta.dni ILIKE :search OR encuesta.nombreCompleto ILIKE :search OR encuesta.telefono ILIKE :search OR encuesta.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSort = new Set([
      'id',
      'dni',
      'barrio',
      'estado',
      'fechaCreacion',
      'fechaActualizacion',
    ]);
    const sortColumn = allowedSort.has(sort) ? sort : 'id';
    qb.orderBy(`encuesta.${sortColumn}`, order as 'ASC' | 'DESC');

    qb.skip((page - 1) * per_page).take(per_page);

    const [encuestas, total] = await qb.getManyAndCount();

    return {
      encuestas,
      total,
      page,
      totalPages: Math.ceil(total / per_page),
    };
  }

  async obtenerEstadisticas(barrio?: string) {
    const where = barrio && barrio !== 'todos' ? { barrio } : {};

    const totalEncuestas = await this.encuestaRepo.count({ where });

    const porBarrio = barrio && barrio !== 'todos'
      ? [{ barrio, cantidad: totalEncuestas }]
      : await this.encuestaRepo
          .createQueryBuilder('encuesta')
          .select('encuesta.barrio', 'barrio')
          .addSelect('COUNT(*)', 'cantidad')
          .groupBy('encuesta.barrio')
          .orderBy('cantidad', 'DESC')
          .getRawMany();

    const encuestas = await this.encuestaRepo.find({ where });

    const obrasCount: Record<string, number> = {};
    const serviciosCount: Record<string, number> = {};
    let personasDejaronContacto = 0;

    const obrasUrgentesOtroMap = new Map<string, { comentario: string; encuestaId: number }>();
    const serviciosMejorarOtroMap = new Map<string, { comentario: string; encuestaId: number }>();
    const espacioMejorarMap = new Map<string, { comentario: string; encuestaId: number }>();
    const propuestasMap = new Map<string, { comentario: string; encuestaId: number }>();

    for (const encuesta of encuestas) {
      (encuesta.obrasUrgentes || []).forEach((obra) => {
        obrasCount[obra] = (obrasCount[obra] || 0) + 1;
      });

      (encuesta.serviciosMejorar || []).forEach((servicio) => {
        serviciosCount[servicio] = (serviciosCount[servicio] || 0) + 1;
      });

      if (encuesta.quiereContacto) {
        personasDejaronContacto += 1;
      }

      if (encuesta.obrasUrgentesOtro && encuesta.obrasUrgentesOtro.trim() !== '') {
        const key = `${encuesta.id}-${encuesta.obrasUrgentesOtro.trim()}`;
        obrasUrgentesOtroMap.set(key, {
          comentario: encuesta.obrasUrgentesOtro.trim(),
          encuestaId: encuesta.id,
        });
      }

      if (encuesta.serviciosMejorarOtro && encuesta.serviciosMejorarOtro.trim() !== '') {
        const key = `${encuesta.id}-${encuesta.serviciosMejorarOtro.trim()}`;
        serviciosMejorarOtroMap.set(key, {
          comentario: encuesta.serviciosMejorarOtro.trim(),
          encuestaId: encuesta.id,
        });
      }

      if (encuesta.espacioMejorar && encuesta.espacioMejorar.trim() !== '') {
        const key = `${encuesta.id}-${encuesta.espacioMejorar.trim()}`;
        espacioMejorarMap.set(key, {
          comentario: encuesta.espacioMejorar.trim(),
          encuestaId: encuesta.id,
        });
      }

      if (encuesta.propuesta && encuesta.propuesta.trim() !== '') {
        const key = `${encuesta.id}-${encuesta.propuesta.trim()}`;
        propuestasMap.set(key, {
          comentario: encuesta.propuesta.trim(),
          encuestaId: encuesta.id,
        });
      }
    }

    const obrasMasVotadas = Object.entries(obrasCount)
      .map(([obra, cantidad]) => ({ obra, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    const serviciosMasVotados = Object.entries(serviciosCount)
      .map(([servicio, cantidad]) => ({ servicio, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    const porcentajeContacto = totalEncuestas > 0
      ? Math.round((personasDejaronContacto / totalEncuestas) * 100)
      : 0;

    return {
      totalEncuestas,
      porBarrio,
      obrasMasVotadas,
      serviciosMasVotados,
      contacto: {
        personasDejaronContacto,
        porcentajeContacto,
      },
      otrosComentarios: {
        obrasUrgentesOtro: Array.from(obrasUrgentesOtroMap.values()),
        serviciosMejorarOtro: Array.from(serviciosMejorarOtroMap.values()),
        espaciosYPropuestas: {
          espacioMejorar: Array.from(espacioMejorarMap.values()),
          propuestas: Array.from(propuestasMap.values()),
        },
      },
    };
  }

  async obtenerEstadisticasRedis() {
    if (!this.redis.isEnabled()) {
      return {
        encuestasTemporales: 0,
        encuestasNoProcesadas: 0,
        memoriaUsada: 'N/A',
        redisEnabled: false,
      };
    }

    let memoriaUsada = 'N/A';
    try {
      const info = await this.redis.info('memory');
      const line = info.split('\r\n').find((l) => l.startsWith('used_memory_human:'));
      memoriaUsada = line ? line.split(':')[1] : 'N/A';
    } catch {
      memoriaUsada = 'N/A';
    }

    return {
      encuestasTemporales: 0,
      encuestasNoProcesadas: 0,
      memoriaUsada,
      redisEnabled: true,
    };
  }

  private async getCache<T>(key: string): Promise<T | null> {
    if (!this.redis.isEnabled()) return null;
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private async setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.redis.isEnabled()) return;
    try {
      await this.redis.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // ignore cache errors
    }
  }
}

function normalizeDni(dni: string): string {
  return typeof dni === 'string' ? dni.replace(/\D/g, '') : '';
}

function endOfDay(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}
