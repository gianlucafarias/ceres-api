import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Converstation } from '../../entities/conversation.entity';
import { ConversacionesService } from './conversaciones.service';

describe('ConversacionesService', () => {
  let service: ConversacionesService;
  let repo: any;
  let qb: any;

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    };

    repo = {
      createQueryBuilder: jest.fn(() => qb),
    };

    const module = await Test.createTestingModule({
      providers: [
        ConversacionesService,
        { provide: getRepositoryToken(Converstation), useValue: repo },
      ],
    }).compile();

    service = module.get(ConversacionesService);
  });

  it('filtra por rango cuando hay fechas', async () => {
    await service.getAll('2026-02-01', '2026-02-04');
    expect(qb.where).toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('sin fechas devuelve todo', async () => {
    await service.getAll();
    expect(qb.where).not.toHaveBeenCalled();
    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});
