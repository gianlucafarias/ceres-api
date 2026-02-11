import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsOrder,
  FindOptionsWhere,
  Like,
  Repository,
} from 'typeorm';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamosFiltroAdminDto } from './dto/reclamos-admin.dto';

type RawTipoRow = { nombre: string };

@Injectable()
export class ReclamosRepository {
  constructor(
    @InjectRepository(Reclamo)
    private readonly repo: Repository<Reclamo>,
  ) {}

  create(data: Partial<Reclamo>): Reclamo {
    return this.repo.create(data);
  }

  save(entity: Reclamo): Promise<Reclamo> {
    return this.repo.save(entity);
  }

  findById(id: number): Promise<Reclamo | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByTelefono(telefono: string): Promise<Reclamo[]> {
    return this.repo.find({
      where: { telefono },
      order: { fecha: 'DESC' },
    });
  }

  findLatestByTelefono(telefono: string): Promise<Reclamo | null> {
    return this.repo.findOne({
      where: { telefono },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  async findDistinctTipos(): Promise<string[]> {
    const rows = (await this.repo.query(`
      SELECT DISTINCT TRIM(reclamo) AS nombre
      FROM reclamos
      WHERE reclamo IS NOT NULL
        AND TRIM(reclamo) <> ''
      ORDER BY nombre ASC
    `)) as RawTipoRow[];

    return rows
      .map((row) => row.nombre)
      .filter(
        (nombre): nombre is string =>
          typeof nombre === 'string' && nombre.length > 0,
      );
  }

  findAndCountForAdmin(
    filters: ReclamosFiltroAdminDto,
  ): Promise<[Reclamo[], number]> {
    const { page = 1, per_page = 10, sort = 'id', order = 'DESC' } = filters;
    const skip = (page - 1) * per_page;
    const where = this.buildWhere(filters);
    const orderBy = this.buildOrder(sort, order);

    return this.repo.findAndCount({
      where,
      skip,
      take: per_page,
      order: orderBy,
    });
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }

  private buildWhere(
    filters: ReclamosFiltroAdminDto,
  ): FindOptionsWhere<Reclamo> {
    const { estado, prioridad, barrio, search, from, to } = filters;
    const where: FindOptionsWhere<Reclamo> = {};

    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (barrio) where.barrio = barrio;
    if (search) where.reclamo = Like(`%${search}%`);

    if (from && to) where.fecha = Between(new Date(from), endOfDay(to));
    else if (from) where.fecha = Between(new Date(from), new Date());
    else if (to) where.fecha = Between(new Date(0), endOfDay(to));

    return where;
  }

  private buildOrder(
    sort: string,
    order: 'ASC' | 'DESC',
  ): FindOptionsOrder<Reclamo> {
    const allowedSort: Array<keyof Reclamo> = [
      'id',
      'fecha',
      'estado',
      'prioridad',
      'barrio',
      'reclamo',
    ];

    const sortField: keyof Reclamo = allowedSort.includes(sort as keyof Reclamo)
      ? (sort as keyof Reclamo)
      : 'id';

    return { [sortField]: order };
  }
}

function endOfDay(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}
