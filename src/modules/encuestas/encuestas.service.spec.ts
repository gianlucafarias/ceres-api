import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EncuestaPresupuesto } from '../../entities/encuesta-presupuesto.entity';
import { RedisService } from '../../shared/redis/redis.service';
import { EncuestasService } from './encuestas.service';

describe('EncuestasService', () => {
  let service: EncuestasService;
  let repo: any;

  beforeEach(async () => {
    repo = mockRepo();

    const module = await Test.createTestingModule({
      providers: [
        EncuestasService,
        { provide: getRepositoryToken(EncuestaPresupuesto), useValue: repo },
        { provide: RedisService, useValue: mockRedis() },
      ],
    }).compile();

    service = module.get(EncuestasService);
  });

  it('validarDni devuelve false si ya existe', async () => {
    repo.findOne.mockResolvedValue({ id: 1, dni: '12345678' });
    const res = await service.validarDni('12.345.678');
    expect(res.puedeContinuar).toBe(false);
  });

  it('guardarEncuesta guarda con estado completada', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((x: any) => x);
    repo.save.mockResolvedValue({ id: 1, estado: 'completada', dni: '12345678' });

    const res = await service.guardarEncuesta({
      dni: '12345678',
      barrio: 'Centro',
      obrasUrgentes: ['obra1'],
      obrasUrgentesOtro: '',
      serviciosMejorar: ['serv1'],
      serviciosMejorarOtro: '',
      espacioMejorar: '',
      propuesta: '',
      quiereContacto: false,
      nombreCompleto: '',
      telefono: '',
      email: '',
    });

    expect(res.estado).toBe('completada');
  });

  it('obtenerEstadisticas retorna estructura esperada', async () => {
    repo.count.mockResolvedValue(2);
    repo.createQueryBuilder.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ barrio: 'Centro', cantidad: '2' }]),
    });
    repo.find.mockResolvedValue([
      {
        id: 1,
        obrasUrgentes: ['obra1'],
        serviciosMejorar: ['serv1'],
        quiereContacto: true,
        obrasUrgentesOtro: 'otra obra',
        serviciosMejorarOtro: null,
        espacioMejorar: 'plaza',
        propuesta: 'mas arboles',
      },
      {
        id: 2,
        obrasUrgentes: ['obra1'],
        serviciosMejorar: ['serv2'],
        quiereContacto: false,
        obrasUrgentesOtro: null,
        serviciosMejorarOtro: 'otro servicio',
        espacioMejorar: null,
        propuesta: null,
      },
    ]);

    const res = await service.obtenerEstadisticas();

    expect(res.totalEncuestas).toBe(2);
    expect(res.porBarrio.length).toBe(1);
    expect(res.obrasMasVotadas[0].obra).toBe('obra1');
    expect(res.serviciosMasVotados.length).toBe(2);
    expect(res.contacto.personasDejaronContacto).toBe(1);
  });
});

function mockRepo() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };
}

function mockRedis() {
  return {
    isEnabled: jest.fn(() => false),
    get: jest.fn(),
    setEx: jest.fn(),
    info: jest.fn(),
  };
}
