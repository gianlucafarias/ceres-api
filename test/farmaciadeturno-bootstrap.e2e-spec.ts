import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminApiKeyGuard } from '../src/common/guards/admin-api-key.guard';
import { DutySchedule } from '../src/entities/duty-schedule.entity';
import { Pharmacy } from '../src/entities/pharmacy.entity';
import { FarmaciasController } from '../src/modules/farmacias/farmacias.controller';
import { FarmaciasService } from '../src/modules/farmacias/farmacias.service';

type DutyPreview = {
  date: string;
  schedule: {
    pharmacy: Pharmacy;
  } | null;
};

type BootstrapBody = {
  from: string;
  to: string;
  count: number;
  quickPreview: {
    today: DutyPreview;
    tomorrow: DutyPreview;
    dayAfterTomorrow: DutyPreview;
  };
  rows: Array<{
    pharmacyCode: string;
    pharmacy: Pharmacy;
  }>;
  pharmacies: Pharmacy[];
};

type QueryBuilderMock = {
  leftJoinAndSelect: (
    relation: string,
    alias: string,
    condition?: string,
    parameters?: Record<string, unknown>,
  ) => QueryBuilderMock;
  where: (sql: string, params?: Record<string, unknown>) => QueryBuilderMock;
  andWhere: (sql: string, params?: Record<string, unknown>) => QueryBuilderMock;
  orderBy: (sql: string, order?: 'ASC' | 'DESC') => QueryBuilderMock;
  limit: (limit: number) => QueryBuilderMock;
  getMany: () => Promise<DutySchedule[]>;
};

describe('Farmacia de Turno bootstrap (e2e)', () => {
  let app: INestApplication<App>;
  const adminApiKey = 'admin-key-test';

  let pharmacyRepo: {
    findOne: jest.MockedFunction<
      (options?: unknown) => Promise<Pharmacy | null>
    >;
    save: jest.MockedFunction<(input: Partial<Pharmacy>) => Promise<Pharmacy>>;
  };

  let dutyRepo: {
    findOne: jest.MockedFunction<
      (options?: unknown) => Promise<DutySchedule | null>
    >;
    create: jest.MockedFunction<
      (input: Partial<DutySchedule>) => Partial<DutySchedule>
    >;
    save: jest.MockedFunction<
      (input: Partial<DutySchedule>) => Promise<DutySchedule>
    >;
    createQueryBuilder: jest.MockedFunction<
      (alias: string) => QueryBuilderMock
    >;
  };

  let pharmacies: Map<string, Pharmacy>;
  let dutySchedules: Map<string, DutySchedule>;

  const clonePharmacy = (pharmacy: Pharmacy): Pharmacy => ({ ...pharmacy });

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

  const asString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;

  const hydrateDuty = (row: DutySchedule): DutySchedule => {
    const pharmacy = pharmacies.get(row.pharmacyCode);

    return {
      ...row,
      pharmacy: pharmacy ? clonePharmacy(pharmacy) : row.pharmacy,
    };
  };

  const parseWhereDate = (options?: unknown): string | undefined => {
    if (!isRecord(options)) return undefined;
    const where = options.where;
    if (!isRecord(where)) return undefined;
    return asString(where.date);
  };

  const parseWhereCode = (options?: unknown): string | undefined => {
    if (!isRecord(options)) return undefined;
    const where = options.where;
    if (!isRecord(where)) return undefined;
    return asString(where.code);
  };

  const createDutyQueryBuilder = (): QueryBuilderMock => {
    let fromRange: string | undefined;
    let toRange: string | undefined;
    let fromDate: string | undefined;
    let pharmacyCode: string | undefined;
    let maxRows: number | undefined;

    const qb: QueryBuilderMock = {
      leftJoinAndSelect: () => qb,
      where: (sql: string, params?: Record<string, unknown>) => {
        if (sql.includes('ds.date >= :from AND ds.date <= :to')) {
          fromRange = asString(params?.from);
          toRange = asString(params?.to);
        }

        if (sql.includes('ds.pharmacy_code = :code')) {
          pharmacyCode = asString(params?.code);
        }

        return qb;
      },
      andWhere: (sql: string, params?: Record<string, unknown>) => {
        if (sql.includes('ds.date >= :from')) {
          fromDate = asString(params?.from);
        }
        return qb;
      },
      orderBy: () => qb,
      limit: (limit: number) => {
        maxRows = limit;
        return qb;
      },
      getMany: () => {
        let rows = [...dutySchedules.values()].map(hydrateDuty);

        if (fromRange && toRange) {
          rows = rows.filter(
            (row) => row.date >= fromRange && row.date <= toRange,
          );
        }

        if (pharmacyCode) {
          rows = rows.filter((row) => row.pharmacyCode === pharmacyCode);
        }

        if (fromDate) {
          rows = rows.filter((row) => row.date >= fromDate!);
        }

        rows.sort((a, b) => a.date.localeCompare(b.date));

        if (typeof maxRows === 'number') {
          rows = rows.slice(0, maxRows);
        }

        return Promise.resolve(rows);
      },
    };

    return qb;
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-10T09:00:00.000Z'));

    pharmacies = new Map<string, Pharmacy>([
      [
        'ABC',
        {
          code: 'ABC',
          name: 'Farmacia ABC',
          address: 'Calle 1',
          phone: '111',
          lat: null,
          lng: null,
          googleMapsAddress: null,
        },
      ],
      [
        'DEF',
        {
          code: 'DEF',
          name: 'Farmacia DEF',
          address: 'Calle 2',
          phone: '222',
          lat: null,
          lng: null,
          googleMapsAddress: null,
        },
      ],
    ]);

    dutySchedules = new Map<string, DutySchedule>([
      [
        '2026-02-10',
        {
          date: '2026-02-10',
          pharmacyCode: 'ABC',
          pharmacy: clonePharmacy(pharmacies.get('ABC')!),
          scheduleYear: 2026,
          source: 'seed',
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ],
      [
        '2026-02-11',
        {
          date: '2026-02-11',
          pharmacyCode: 'DEF',
          pharmacy: clonePharmacy(pharmacies.get('DEF')!),
          scheduleYear: 2026,
          source: 'seed',
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ],
      [
        '2026-02-12',
        {
          date: '2026-02-12',
          pharmacyCode: 'ABC',
          pharmacy: clonePharmacy(pharmacies.get('ABC')!),
          scheduleYear: 2026,
          source: 'seed',
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ],
    ]);

    pharmacyRepo = {
      findOne: jest.fn((options?: unknown) => {
        const code = parseWhereCode(options);
        if (!code) return Promise.resolve(null);
        const pharmacy = pharmacies.get(code);
        return Promise.resolve(pharmacy ? clonePharmacy(pharmacy) : null);
      }),
      save: jest.fn((input: Partial<Pharmacy>) => {
        const current = pharmacies.get(input.code ?? '');
        const merged = {
          ...current,
          ...input,
        } as Pharmacy;

        pharmacies.set(merged.code, merged);
        return Promise.resolve(clonePharmacy(merged));
      }),
    };

    dutyRepo = {
      findOne: jest.fn((options?: unknown) => {
        const date = parseWhereDate(options);
        if (!date) return Promise.resolve(null);
        const row = dutySchedules.get(date);
        return Promise.resolve(row ? hydrateDuty(row) : null);
      }),
      create: jest.fn((input: Partial<DutySchedule>) => ({ ...input })),
      save: jest.fn((input: Partial<DutySchedule>) => {
        const now = new Date();
        const existing = dutySchedules.get(input.date ?? '');
        const saved: DutySchedule = {
          ...(existing ?? {
            date: input.date ?? '',
            createdAt: now,
          }),
          ...input,
          date: input.date ?? existing?.date ?? '',
          pharmacyCode: input.pharmacyCode ?? existing?.pharmacyCode ?? '',
          pharmacy:
            input.pharmacy ??
            existing?.pharmacy ??
            clonePharmacy(pharmacies.get(input.pharmacyCode ?? '')!),
          scheduleYear:
            input.scheduleYear ?? existing?.scheduleYear ?? now.getFullYear(),
          source: input.source ?? existing?.source ?? null,
          updatedAt: now,
        };

        dutySchedules.set(saved.date, saved);
        return Promise.resolve(hydrateDuty(saved));
      }),
      createQueryBuilder: jest.fn(() => createDutyQueryBuilder()),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FarmaciasController],
      providers: [
        FarmaciasService,
        AdminApiKeyGuard,
        { provide: getRepositoryToken(Pharmacy), useValue: pharmacyRepo },
        { provide: getRepositoryToken(DutySchedule), useValue: dutyRepo },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'ADMIN_API_KEY' ? adminApiKey : undefined,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidUnknownValues: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.useRealTimers();
  });

  it('devuelve payload bootstrap con quickPreview, rows y farmacias deduplicadas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/farmaciadeturno/bootstrap?from=2026-02-10&to=2026-02-10')
      .expect(200);
    const body = response.body as BootstrapBody;

    expect(response.headers.etag).toBeDefined();
    expect(response.headers['cache-control']).toBe(
      'private, max-age=0, must-revalidate',
    );

    expect(body.from).toBe('2026-02-10');
    expect(body.to).toBe('2026-02-10');
    expect(body.count).toBe(1);

    expect(body.quickPreview.today.date).toBe('2026-02-10');
    expect(body.quickPreview.today.schedule?.pharmacy.code).toBe('ABC');
    expect(body.quickPreview.tomorrow.schedule?.pharmacy.code).toBe('DEF');
    expect(body.quickPreview.dayAfterTomorrow.schedule?.pharmacy.code).toBe(
      'ABC',
    );

    expect(body.rows).toHaveLength(1);
    expect(body.rows[0]?.pharmacy.code).toBe('ABC');

    expect(body.pharmacies.map((pharmacy) => pharmacy.code)).toEqual([
      'ABC',
      'DEF',
    ]);
  });

  it('responde 304 cuando coincide If-None-Match en bootstrap', async () => {
    const first = await request(app.getHttpServer())
      .get('/api/v1/farmaciadeturno/bootstrap?from=2026-02-10&to=2026-02-10')
      .expect(200);

    const etag = first.headers.etag as string | undefined;
    expect(etag).toBeDefined();

    await request(app.getHttpServer())
      .get('/api/v1/farmaciadeturno/bootstrap?from=2026-02-10&to=2026-02-10')
      .set('If-None-Match', etag ?? '')
      .expect(304);
  });

  it('invalida ETag de bootstrap tras PUT de turno y farmacia', async () => {
    const initial = await request(app.getHttpServer())
      .get('/api/v1/farmaciadeturno/bootstrap?from=2026-02-10&to=2026-02-10')
      .expect(200);

    const initialEtag = initial.headers.etag;
    if (typeof initialEtag !== 'string') {
      throw new Error('Missing ETag header on initial bootstrap response');
    }

    await request(app.getHttpServer())
      .put('/api/v1/farmaciadeturno/2026-02-10')
      .set('x-api-key', adminApiKey)
      .send({ pharmacyCode: 'DEF' })
      .expect(200);

    const afterDutyUpdate = await request(app.getHttpServer())
      .get('/api/v1/farmaciadeturno/bootstrap?from=2026-02-10&to=2026-02-10')
      .set('If-None-Match', initialEtag)
      .expect(200);
    const bodyAfterDuty = afterDutyUpdate.body as BootstrapBody;

    const dutyEtag = afterDutyUpdate.headers.etag;
    if (typeof dutyEtag !== 'string') {
      throw new Error('Missing ETag header after duty update');
    }

    expect(dutyEtag).toBeDefined();
    expect(dutyEtag).not.toBe(initialEtag);
    expect(bodyAfterDuty.rows[0]?.pharmacyCode).toBe('DEF');
    expect(bodyAfterDuty.rows[0]?.pharmacy.name).toBe('Farmacia DEF');

    await request(app.getHttpServer())
      .put('/api/v1/pharmacy/DEF')
      .set('x-api-key', adminApiKey)
      .send({ name: 'Farmacia DEF Actualizada' })
      .expect(200);

    const afterPharmacyUpdate = await request(app.getHttpServer())
      .get('/api/v1/farmaciadeturno/bootstrap?from=2026-02-10&to=2026-02-10')
      .set('If-None-Match', dutyEtag)
      .expect(200);
    const bodyAfterPharmacy = afterPharmacyUpdate.body as BootstrapBody;

    const pharmacyEtag = afterPharmacyUpdate.headers.etag;
    if (typeof pharmacyEtag !== 'string') {
      throw new Error('Missing ETag header after pharmacy update');
    }

    expect(pharmacyEtag).toBeDefined();
    expect(pharmacyEtag).not.toBe(dutyEtag);
    expect(bodyAfterPharmacy.rows[0]?.pharmacy.name).toBe(
      'Farmacia DEF Actualizada',
    );
  });
});
