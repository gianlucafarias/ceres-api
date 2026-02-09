import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { Notificaciones } from '../../entities/notificaciones.entity';
import { PreferenciasUsuario } from '../../entities/preferencias-usuario.entity';
import { WhatsappTemplateService } from '../../shared/whatsapp/whatsapp-template.service';
import { WhatsappTemplatePayload } from '../../shared/whatsapp/whatsapp.types';
import { OpsNotificationsService } from '../observability/ops-notifications.service';
import { NotificacionesService } from './notificaciones.service';

interface RepoMock<T> {
  findOne: jest.Mock<Promise<T | null>, [unknown]>;
  find: jest.Mock<Promise<T[]>, [unknown?]>;
  create: jest.Mock<T, [Partial<T>]>;
  save: jest.Mock<Promise<T>, [T]>;
}

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  let contactRepo: RepoMock<Contact>;
  let prefRepo: RepoMock<PreferenciasUsuario>;
  let notifRepo: RepoMock<Notificaciones>;
  let whatsapp: {
    sendTemplate: jest.Mock<Promise<void>, [WhatsappTemplatePayload]>;
  };
  let opsNotifications: {
    emitInternalEvent: jest.Mock<void, [unknown]>;
  };

  beforeEach(async () => {
    contactRepo = mockRepo<Contact>();
    prefRepo = mockRepo<PreferenciasUsuario>();
    notifRepo = mockRepo<Notificaciones>();
    whatsapp = {
      sendTemplate: jest
        .fn<Promise<void>, [WhatsappTemplatePayload]>()
        .mockResolvedValue(undefined),
    };
    opsNotifications = {
      emitInternalEvent: jest.fn<void, [unknown]>(),
    };

    const module = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: getRepositoryToken(Contact), useValue: contactRepo },
        {
          provide: getRepositoryToken(PreferenciasUsuario),
          useValue: prefRepo,
        },
        { provide: getRepositoryToken(Notificaciones), useValue: notifRepo },
        { provide: WhatsappTemplateService, useValue: whatsapp },
        { provide: OpsNotificationsService, useValue: opsNotifications },
      ],
    }).compile();

    service = module.get(NotificacionesService);
  });

  it('actualizarPreferencias crea nuevas preferencias', async () => {
    contactRepo.findOne.mockResolvedValue({ id: 1 } as Contact);
    prefRepo.findOne.mockResolvedValue(null);
    prefRepo.create.mockImplementation((x) => x as PreferenciasUsuario);
    prefRepo.save.mockResolvedValue({
      id: 10,
      contactId: 1,
      notificarHumedo: true,
    } as PreferenciasUsuario);

    const res = await service.actualizarPreferencias({
      contact_id: 1,
      notificar_humedo: true,
      notificar_seco: false,
      notificar_patio: false,
      hora_notificacion: '19:00',
    });

    expect(res.contactId).toBe(1);
  });

  it('actualizarSeccion guarda notificacion con seccion', async () => {
    contactRepo.findOne.mockResolvedValue({ id: 1 } as Contact);
    notifRepo.create.mockImplementation((x) => x as Notificaciones);
    notifRepo.save.mockResolvedValue({
      id: 5,
      usuarioId: 1,
      seccionId: 2,
    } as Notificaciones);

    const res = await service.actualizarSeccion({
      contact_id: 1,
      seccion_id: 2,
    });
    expect(res.seccionId).toBe(2);
  });

  it('enviarTemplate llama al servicio de whatsapp', async () => {
    await service.enviarTemplate({
      number: '5493410000000',
      template: 'r_asignado',
      languageCode: 'es_AR',
      components: [],
    });

    expect(whatsapp.sendTemplate).toHaveBeenCalledWith({
      number: '5493410000000',
      template: 'r_asignado',
      languageCode: 'es_AR',
      components: [],
    });
  });
});

function mockRepo<T>(): RepoMock<T> {
  return {
    findOne: jest.fn<Promise<T | null>, [unknown?]>(),
    find: jest.fn<Promise<T[]>, [unknown?]>(),
    create: jest.fn<T, [Partial<T>]>(),
    save: jest.fn<Promise<T>, [T]>(),
  };
}
