import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';
import { ReclamosPdfService } from './reclamos-pdf.service';

describe('ReclamosPdfService', () => {
  it('lanza NotFound cuando no existe reclamo', async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReclamosPdfService,
        {
          provide: getRepositoryToken(Reclamo),
          useValue: { findOne: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: getRepositoryToken(ReclamoHistorial),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    const service = module.get(ReclamosPdfService);
    await expect(service.generatePdfBuffer(999)).rejects.toThrow(
      'Reclamo no encontrado',
    );
  });
});
