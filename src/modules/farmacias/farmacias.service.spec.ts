import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DutySchedule } from '../../entities/duty-schedule.entity';
import { Pharmacy } from '../../entities/pharmacy.entity';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';
import { FarmaciasService } from './farmacias.service';

describe('FarmaciasService', () => {
  let service: FarmaciasService;
  let pharmacyRepo: {
    findOne: jest.MockedFunction<
      (options?: unknown) => Promise<Pharmacy | null>
    >;
    save: jest.MockedFunction<
      (input: Partial<Pharmacy>) => Promise<Partial<Pharmacy>>
    >;
  };
  let dutyRepo: {
    findOne: jest.MockedFunction<
      (options?: unknown) => Promise<DutySchedule | null>
    >;
    create: jest.MockedFunction<
      (input: Partial<DutySchedule>) => Partial<DutySchedule>
    >;
    save: jest.MockedFunction<
      (input: Partial<DutySchedule>) => Promise<Partial<DutySchedule>>
    >;
    createQueryBuilder: jest.MockedFunction<() => QueryBuilderMock>;
  };
  let qb: QueryBuilderMock;
  let activityLog: {
    logActivity: jest.MockedFunction<(params: unknown) => Promise<void>>;
  };

  type QueryBuilderMock = {
    leftJoinAndSelect: jest.MockedFunction<
      (
        relation: string,
        alias: string,
        condition?: string,
        parameters?: Record<string, unknown>,
      ) => QueryBuilderMock
    >;
    where: jest.MockedFunction<
      (sql: string, params?: Record<string, unknown>) => QueryBuilderMock
    >;
    andWhere: jest.MockedFunction<
      (sql: string, params?: Record<string, unknown>) => QueryBuilderMock
    >;
    orderBy: jest.MockedFunction<
      (sql: string, order?: 'ASC' | 'DESC') => QueryBuilderMock
    >;
    limit: jest.MockedFunction<(limit: number) => QueryBuilderMock>;
    getMany: jest.MockedFunction<
      () => Promise<Array<{ date: string; pharmacyCode: string }>>
    >;
  };

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          date: '2026-02-04',
          pharmacyCode: 'ABC',
          pharmacy: { code: 'ABC', name: 'Farmacia ABC' },
        },
      ]),
    };

    pharmacyRepo = {
      findOne: jest.fn(),
      save: jest.fn((x: Partial<Pharmacy>) => Promise.resolve(x)),
    };

    dutyRepo = {
      findOne: jest.fn(),
      create: jest.fn((x: Partial<DutySchedule>) => x),
      save: jest.fn((x: Partial<DutySchedule>) => Promise.resolve(x)),
      createQueryBuilder: jest.fn(() => qb),
    };

    const module = await Test.createTestingModule({
      providers: [
        FarmaciasService,
        { provide: getRepositoryToken(Pharmacy), useValue: pharmacyRepo },
        { provide: getRepositoryToken(DutySchedule), useValue: dutyRepo },
        {
          provide: ActivityLogService,
          useValue: {
            logActivity: jest.fn(() => Promise.resolve()),
          },
        },
      ],
    }).compile();

    service = module.get(FarmaciasService);
    activityLog = module.get(ActivityLogService);
  });

  it('updateDutyByDate crea cuando no existe', async () => {
    pharmacyRepo.findOne.mockResolvedValue({ code: 'ABC' });
    dutyRepo.findOne.mockResolvedValue(null);

    const res = await service.updateDutyByDate('2026-02-04', 'abc');

    expect(res.pharmacyCode).toBe('ABC');
    expect(res.source).toBe('manual-override');
    expect(activityLog.logActivity).toHaveBeenCalled();
  });

  it('actualiza seed de bootstrap ETag al modificar turno o farmacia', async () => {
    const initialSeed = service.getBootstrapEtagSeed(
      '2026-02-01',
      '2026-02-28',
    );

    pharmacyRepo.findOne.mockResolvedValue({ code: 'ABC' });
    await service.updatePharmacy('ABC', { name: 'Farmacia ABC Renovada' });
    const afterPharmacyUpdate = service.getBootstrapEtagSeed(
      '2026-02-01',
      '2026-02-28',
    );

    expect(afterPharmacyUpdate).not.toBe(initialSeed);

    pharmacyRepo.findOne.mockResolvedValue({ code: 'ABC' });
    dutyRepo.findOne.mockResolvedValue({
      date: '2026-02-10',
      pharmacyCode: 'ABC',
      pharmacy: { code: 'ABC' } as Pharmacy,
      scheduleYear: 2026,
      source: null,
    } as DutySchedule);

    await service.updateDutyByDate('2026-02-10', 'ABC');
    const afterDutyUpdate = service.getBootstrapEtagSeed(
      '2026-02-01',
      '2026-02-28',
    );

    expect(afterDutyUpdate).not.toBe(afterPharmacyUpdate);
  });

  it('getBootstrap devuelve quickPreview, rows y farmacias deduplicadas', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-10T12:00:00.000Z'));
    try {
      const pharmacyABC: Pharmacy = {
        code: 'ABC',
        name: 'Farmacia ABC',
        address: 'Calle 1',
        phone: '111',
        lat: null,
        lng: null,
        googleMapsAddress: null,
      };
      const pharmacyDEF: Pharmacy = {
        code: 'DEF',
        name: 'Farmacia DEF',
        address: 'Calle 2',
        phone: '222',
        lat: null,
        lng: null,
        googleMapsAddress: null,
      };

      dutyRepo.findOne.mockImplementation((options?: unknown) => {
        const date = (options as { where?: { date?: string } })?.where?.date;

        if (date === '2026-02-10') {
          return Promise.resolve({
            date: '2026-02-10',
            pharmacyCode: 'ABC',
            pharmacy: pharmacyABC,
            scheduleYear: 2026,
            source: 'seed',
          } as DutySchedule);
        }

        if (date === '2026-02-11') {
          return Promise.resolve({
            date: '2026-02-11',
            pharmacyCode: 'DEF',
            pharmacy: pharmacyDEF,
            scheduleYear: 2026,
            source: 'seed',
          } as DutySchedule);
        }

        if (date === '2026-02-12') {
          return Promise.resolve({
            date: '2026-02-12',
            pharmacyCode: 'ABC',
            pharmacy: pharmacyABC,
            scheduleYear: 2026,
            source: 'seed',
          } as DutySchedule);
        }

        return Promise.resolve(null);
      });

      qb.getMany.mockResolvedValue([
        {
          date: '2026-02-10',
          pharmacyCode: 'ABC',
          pharmacy: pharmacyABC,
        },
        {
          date: '2026-02-11',
          pharmacyCode: 'DEF',
          pharmacy: pharmacyDEF,
        },
      ] as Array<{ date: string; pharmacyCode: string }>);

      const payload = await service.getBootstrap('2026-02-10', '2026-02-11');

      expect(payload.rows).toHaveLength(2);
      expect(payload.rows[0]?.pharmacy?.code).toBe('ABC');
      expect(payload.quickPreview.today.schedule?.pharmacy.code).toBe('ABC');
      expect(payload.quickPreview.tomorrow.schedule?.pharmacy.code).toBe('DEF');
      expect(payload.pharmacies.map((pharmacy) => pharmacy.code)).toEqual([
        'ABC',
        'DEF',
      ]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('getCalendar usa la fecha de Argentina para hoy/manana/pasado', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-10T01:30:00.000Z'));
    dutyRepo.findOne.mockResolvedValue(null);

    try {
      await service.getCalendar();

      const queriedDates = dutyRepo.findOne.mock.calls.map(
        ([options]) => (options as { where?: { date?: string } })?.where?.date,
      );

      expect(queriedDates).toEqual(['2026-02-09', '2026-02-10', '2026-02-11']);
    } finally {
      jest.useRealTimers();
    }
  });

  it('getDutyByPharmacy limita resultados', async () => {
    const res = await service.getDutyByPharmacy('ABC', '2026-02-01', 5);
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'ds.pharmacy',
      'pharmacy',
    );
    expect(qb.limit).toHaveBeenCalledWith(5);
    expect(res.length).toBe(1);
  });
});
