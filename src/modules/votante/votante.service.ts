import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Votante } from '../../entities/votante.entity';
import {
  ImportarVotantesDto,
  VotanteLookupResponseDto,
} from './dto/votante.dto';

@Injectable()
export class VotanteService {
  constructor(
    @InjectRepository(Votante)
    private readonly votanteRepo: Repository<Votante>,
  ) {}

  async obtenerPorDocumento(
    documento: string,
  ): Promise<VotanteLookupResponseDto> {
    const normalizedDocumento = normalizeDocumento(documento);
    const votante = await this.votanteRepo.findOne({
      where: { documento: normalizedDocumento },
    });

    if (!votante) {
      return {
        documento: normalizedDocumento,
        error: `No se encontro informacion electoral para el DNI ${normalizedDocumento}.`,
      };
    }

    return {
      mesa: votante.mesa,
      nombre: votante.nombre,
      documento: votante.documento,
      orden: votante.orden,
      direccion: votante.direccion,
    };
  }

  async importar(
    dto: ImportarVotantesDto,
  ): Promise<{ inserted: number; replaced: boolean }> {
    const registros = dto.registros ?? [];
    const replaced = dto.reemplazar === true;

    if (replaced) {
      await this.votanteRepo.clear();
    }

    if (registros.length === 0) {
      return {
        inserted: 0,
        replaced,
      };
    }

    const entities = registros.map((item) =>
      this.votanteRepo.create({
        mesa: item.mesa.trim(),
        orden: item.orden.trim(),
        nombre: item.nombre.trim(),
        direccion: item.direccion.trim(),
        documento: normalizeDocumento(item.documento),
        clase: item.clase?.trim() || '',
        anioNacimiento: item.anioNacimiento?.trim() || '',
        provincia: item.provincia?.trim() || '',
        departamento: item.departamento?.trim() || '',
        localidad: item.localidad?.trim() || '',
      }),
    );

    await this.votanteRepo.save(entities, { chunk: 500 });

    return {
      inserted: entities.length,
      replaced,
    };
  }
}

function normalizeDocumento(documento: string): string {
  const onlyDigits = (documento || '').replace(/\D+/g, '');
  return onlyDigits || documento.trim();
}
