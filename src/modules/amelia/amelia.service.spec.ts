import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmeliaTurno } from '../../entities/amelia-turno.entity';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';
import { WhatsappTemplateService } from '../../shared/whatsapp/whatsapp-template.service';
import { AmeliaWebhookParser } from './amelia-webhook.parser';
import { AmeliaService } from './amelia.service';
import { AmeliaTurnoService } from './amelia-turno.service';

interface RepoMock<T> {
  findOne: jest.Mock<Promise<T | null>, [unknown]>;
  create: jest.Mock<T, [Partial<T>]>;
  save: jest.Mock<Promise<T>, [T]>;
  find: jest.Mock<Promise<T[]>, [unknown?]>;
  createQueryBuilder: jest.Mock<unknown, []>;
}

describe('AmeliaService', () => {
  let service: AmeliaService;
  let turnoRepo: RepoMock<AmeliaTurno>;
  let activityLog: { logActivity: jest.Mock<Promise<void>, [unknown]> };
  let whatsapp: { sendTemplate: jest.Mock<Promise<void>, [unknown]> };

  beforeEach(async () => {
    turnoRepo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x as AmeliaTurno),
      save: jest.fn(async (x) => ({ ...x, id: x.id ?? 1 } as AmeliaTurno)),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    activityLog = { logActivity: jest.fn().mockResolvedValue(undefined) };
    whatsapp = { sendTemplate: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        AmeliaWebhookParser,
        AmeliaTurnoService,
        AmeliaService,
        { provide: getRepositoryToken(AmeliaTurno), useValue: turnoRepo },
        { provide: ActivityLogService, useValue: activityLog },
        { provide: WhatsappTemplateService, useValue: whatsapp },
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
  });

  it('procesa webhook y envia notificacion', async () => {
    turnoRepo.findOne.mockResolvedValue(null);

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
    expect(activityLog.logActivity).toHaveBeenCalled();
    expect(whatsapp.sendTemplate).toHaveBeenCalled();
  });
});
