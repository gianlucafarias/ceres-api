import axios from 'axios';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { Notificaciones } from '../../entities/notificaciones.entity';
import { PreferenciasUsuario } from '../../entities/preferencias-usuario.entity';
import { NotificacionesService } from './notificaciones.service';

jest.mock('axios', () => ({
  post: jest.fn(),
}));

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  let contactRepo: any;
  let prefRepo: any;
  let notifRepo: any;

  beforeEach(async () => {
    contactRepo = mockRepo();
    prefRepo = mockRepo();
    notifRepo = mockRepo();

    const module = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: getRepositoryToken(Contact), useValue: contactRepo },
        { provide: getRepositoryToken(PreferenciasUsuario), useValue: prefRepo },
        { provide: getRepositoryToken(Notificaciones), useValue: notifRepo },
      ],
    }).compile();

    service = module.get(NotificacionesService);
  });

  it('actualizarPreferencias crea nuevas preferencias', async () => {
    contactRepo.findOne.mockResolvedValue({ id: 1 });
    prefRepo.findOne.mockResolvedValue(null);
    prefRepo.create.mockImplementation((x: any) => x);
    prefRepo.save.mockResolvedValue({ id: 10, contactId: 1, notificarHumedo: true });

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
    contactRepo.findOne.mockResolvedValue({ id: 1 });
    notifRepo.create.mockImplementation((x: any) => x);
    notifRepo.save.mockResolvedValue({ id: 5, usuarioId: 1, seccionId: 2 });

    const res = await service.actualizarSeccion({ contact_id: 1, seccion_id: 2 });
    expect(res.seccionId).toBe(2);
  });

  it('enviarTemplate llama al endpoint de whatsapp', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: { ok: true } });

    await service.enviarTemplate({
      number: '5493410000000',
      template: 'r_asignado',
      languageCode: 'es_AR',
      components: [],
    });

    expect(axios.post).toHaveBeenCalledWith('https://api.ceres.gob.ar/v1/template', {
      number: '5493410000000',
      template: 'r_asignado',
      languageCode: 'es_AR',
      components: [],
    });
  });
});

function mockRepo() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
}
