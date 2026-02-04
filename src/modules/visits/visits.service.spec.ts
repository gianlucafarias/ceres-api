import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Converstation } from '../../entities/conversation.entity';
import { Flow } from '../../entities/flow.entity';
import { VisitsService } from './visits.service';

describe('VisitsService', () => {
  let service: VisitsService;
  let flowRepo: any;
  let convRepo: any;

  beforeEach(async () => {
    flowRepo = {
      find: jest.fn().mockResolvedValue([{ id: 1, nombre_flujo: 'F1', contador: 2 }]),
    };
    convRepo = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      })),
    };

    const module = await Test.createTestingModule({
      providers: [
        VisitsService,
        { provide: getRepositoryToken(Flow), useValue: flowRepo },
        { provide: getRepositoryToken(Converstation), useValue: convRepo },
      ],
    }).compile();

    service = module.get(VisitsService);
  });

  it('retorna total usando rango', async () => {
    const res = await service.getVisitasFlujo({ from: '2026-02-01', to: '2026-02-03' });
    expect(res.totalVisitas).toBe(3);
  });

  it('sin rango usa tabla visitas_flujo', async () => {
    const res = await service.getVisitasFlujo({});
    expect(res.visitasFlujo[0].nombre_flujo).toBe('F1');
  });
});
