import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DutySchedule } from '../../entities/duty-schedule.entity';
import { Pharmacy } from '../../entities/pharmacy.entity';
import { FarmaciasService } from './farmacias.service';

describe('FarmaciasService', () => {
  let service: FarmaciasService;
  let pharmacyRepo: any;
  let dutyRepo: any;
  let qb: any;

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ date: '2026-02-04', pharmacyCode: 'ABC' }]),
    };

    pharmacyRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (x: any) => x),
    };

    dutyRepo = {
      findOne: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
      createQueryBuilder: jest.fn(() => qb),
    };

    const module = await Test.createTestingModule({
      providers: [
        FarmaciasService,
        { provide: getRepositoryToken(Pharmacy), useValue: pharmacyRepo },
        { provide: getRepositoryToken(DutySchedule), useValue: dutyRepo },
      ],
    }).compile();

    service = module.get(FarmaciasService);
  });

  it('updateDutyByDate crea cuando no existe', async () => {
    pharmacyRepo.findOne.mockResolvedValue({ code: 'ABC' });
    dutyRepo.findOne.mockResolvedValue(null);

    const res = await service.updateDutyByDate('2026-02-04', 'abc');

    expect(res.pharmacyCode).toBe('ABC');
    expect(res.source).toBe('manual-override');
  });

  it('getDutyByPharmacy limita resultados', async () => {
    const res = await service.getDutyByPharmacy('ABC', '2026-02-01', 5);
    expect(qb.limit).toHaveBeenCalledWith(5);
    expect(res.length).toBe(1);
  });
});
