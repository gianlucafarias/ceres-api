import axios from 'axios';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';
import { AmeliaTurno } from '../../entities/amelia-turno.entity';
import { AmeliaService } from './amelia.service';

jest.mock('axios', () => ({
  post: jest.fn(),
}));

describe('AmeliaService', () => {
  let service: AmeliaService;
  let turnoRepo: any;
  let activityRepo: any;

  beforeEach(async () => {
    turnoRepo = {
      findOne: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ ...x, id: x.id ?? 1 })),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    activityRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
    };

    const module = await Test.createTestingModule({
      providers: [
        AmeliaService,
        { provide: getRepositoryToken(AmeliaTurno), useValue: turnoRepo },
        { provide: getRepositoryToken(ActivityLog), useValue: activityRepo },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const values: Record<string, string> = {
                WHATSAPP_TEMPLATE_TURNO_LICENCIA: 'turno_licencia_confirmado',
                WHATSAPP_TEMPLATE_TURNO_CANCELADO: 'turno_licencia_cancelado',
              };
              return values[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AmeliaService);
    jest.clearAllMocks();
  });

  it('procesa webhook y envia notificacion', async () => {
    turnoRepo.findOne.mockResolvedValue(null);
    (axios.post as jest.Mock).mockResolvedValue({ data: { ok: true } });

    const payload = {
      appointment: {
        id: 200,
        status: 'approved',
        serviceId: 1,
        bookingStart: '2026-02-04T10:00:00Z',
        bookingEnd: '2026-02-04T10:30:00Z',
        service: { id: 1, name: 'Licencia', description: 'Desc' },
        provider: { id: 1, firstName: 'Ana', lastName: 'Lopez', email: 'ana@demo.com' },
        location: { name: 'Municipalidad' },
        bookings: {
          '1': {
            id: 111,
            customerId: 222,
            status: 'approved',
            cancelUrl: 'x',
            customerPanelUrl: 'y',
            customer: {
              id: 222,
              firstName: 'Juan',
              lastName: 'Perez',
              email: 'juan@demo.com',
              phone: '+549123456789',
            },
          },
        },
      },
    };

    const turno = await service.procesarWebhook(payload);

    expect(turno.ameliaBookingId).toBe(111);
    expect(activityRepo.save).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.ceres.gob.ar/v1/template',
      expect.objectContaining({
        number: '+549123456789',
        template: 'turno_licencia_confirmado',
      }),
    );
  });
});
