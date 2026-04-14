import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QrTracking } from '../../entities/qr-tracking.entity';
import { QrTrackingService } from './qr-tracking.service';

describe('QrTrackingService', () => {
  let service: QrTrackingService;
  let repo: {
    findOne: jest.MockedFunction<
      (options?: unknown) => Promise<QrTracking | null>
    >;
    create: jest.MockedFunction<
      (value: Partial<QrTracking>) => Partial<QrTracking>
    >;
    save: jest.MockedFunction<
      (value: Partial<QrTracking>) => Promise<Partial<QrTracking>>
    >;
    find: jest.MockedFunction<(options?: unknown) => Promise<QrTracking[]>>;
    delete: jest.MockedFunction<
      (criteria: unknown) => Promise<{ affected?: number }>
    >;
    increment: jest.MockedFunction<
      (
        criteria: unknown,
        propertyPath: string,
        value: number | string,
      ) => Promise<unknown>
    >;
    update: jest.MockedFunction<
      (criteria: unknown, partialEntity: Partial<QrTracking>) => Promise<unknown>
    >;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((value: Partial<QrTracking>) => value),
      save: jest.fn((value: Partial<QrTracking>) => Promise.resolve(value)),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      increment: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        QrTrackingService,
        { provide: getRepositoryToken(QrTracking), useValue: repo },
      ],
    }).compile();

    service = module.get(QrTrackingService);
  });

  it('resuelve targetUrl e incrementa tracking por id', async () => {
    repo.findOne.mockResolvedValue({
      id: 'tracking-id',
      targetUrl: 'https://ceres.gob.ar/turnos',
    } as QrTracking);

    const result = await service.resolveTrackedTarget('turnos-licencias');

    expect(result).toEqual({
      id: 'tracking-id',
      targetUrl: 'https://ceres.gob.ar/turnos',
    });
    expect(repo.increment).toHaveBeenCalledWith(
      { id: 'tracking-id' },
      'scanCount',
      1,
    );
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'tracking-id' },
      expect.objectContaining({
        lastScannedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });

  it('lanza not found si no existe el slug', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      service.resolveTrackedTarget('slug-inexistente'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lanza internal error si targetUrl viene vacia', async () => {
    repo.findOne.mockResolvedValue({
      id: 'tracking-id',
      targetUrl: null,
    } as unknown as QrTracking);

    await expect(
      service.resolveTrackedTarget('slug-rotura'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
