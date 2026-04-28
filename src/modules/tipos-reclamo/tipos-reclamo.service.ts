import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoReclamo } from '../../entities/tipo-reclamo.entity';
import { UpsertTipoReclamoDto } from './dto/tipos-reclamo.dto';

@Injectable()
export class TiposReclamoService {
  constructor(
    @InjectRepository(TipoReclamo)
    private readonly repo: Repository<TipoReclamo>,
  ) {}

  listar(): Promise<TipoReclamo[]> {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async crear(dto: UpsertTipoReclamoDto): Promise<TipoReclamo> {
    const nombre = dto.nombre.trim();
    const existente = await this.repo.findOne({ where: { nombre } });
    if (existente) {
      throw new ConflictException(`El tipo de reclamo "${nombre}" ya existe.`);
    }

    const entity = this.repo.create({ nombre });
    return this.repo.save(entity);
  }

  async actualizar(
    id: number,
    dto: UpsertTipoReclamoDto,
  ): Promise<TipoReclamo> {
    const actual = await this.repo.findOne({ where: { id } });
    if (!actual) {
      throw new NotFoundException(
        `Tipo de reclamo con id ${id} no encontrado.`,
      );
    }

    const nombre = dto.nombre.trim();
    const colision = await this.repo.findOne({ where: { nombre } });
    if (colision && colision.id !== id) {
      throw new ConflictException(`El tipo de reclamo "${nombre}" ya existe.`);
    }

    actual.nombre = nombre;
    return this.repo.save(actual);
  }

  async eliminar(id: number): Promise<{ ok: true }> {
    const result = await this.repo.delete({ id });
    if (!result.affected) {
      throw new NotFoundException(
        `Tipo de reclamo con id ${id} no encontrado.`,
      );
    }
    return { ok: true };
  }
}
