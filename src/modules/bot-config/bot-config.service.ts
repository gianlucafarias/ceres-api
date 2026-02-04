import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotConfig } from '../../entities/bot-config.entity';
import { CreateBotConfigDto, UpdateBotConfigDto } from './dto/bot-config.dto';

@Injectable()
export class BotConfigService {
  constructor(
    @InjectRepository(BotConfig)
    private readonly repo: Repository<BotConfig>,
  ) {}

  async getAll() {
    return this.repo.find();
  }

  async getByKey(clave: string) {
    return this.repo.findOne({ where: { clave } });
  }

  async create(clave: string, dto: CreateBotConfigDto) {
    const existing = await this.getByKey(clave);
    if (existing) {
      throw new ConflictException(`La configuracion con clave "${clave}" ya existe. Use PUT para actualizar.`);
    }

    const fecha_expiracion = this.parseFechaExpiracion(dto.fecha_expiracion);

    const config = this.repo.create({
      clave,
      valor: dto.valor,
      activo: dto.activo,
      fecha_expiracion,
      fecha_actualizacion: new Date(),
    });

    return this.repo.save(config);
  }

  async update(clave: string, dto: UpdateBotConfigDto) {
    const existing = await this.getByKey(clave);
    if (!existing) {
      throw new NotFoundException(`Configuracion con clave "${clave}" no encontrada. No se pudo actualizar.`);
    }

    const fecha_expiracion = this.parseFechaExpiracion(dto.fecha_expiracion, true);

    existing.valor = dto.valor;
    existing.activo = dto.activo;
    if (dto.fecha_expiracion !== undefined) {
      existing.fecha_expiracion = fecha_expiracion;
    }
    existing.fecha_actualizacion = new Date();

    return this.repo.save(existing);
  }

  private parseFechaExpiracion(value?: string | null, allowNull: boolean = false): Date | null {
    if (value === null && allowNull) {
      return null;
    }
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      throw new Error('Datos invalidos: "fecha_expiracion" debe ser una fecha valida o null.');
    }
    return parsed;
  }
}
