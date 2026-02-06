import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EncuestaPresupuesto } from '../../entities/encuesta-presupuesto.entity';
import { RedisService } from '../../shared/redis/redis.service';
import { EncuestasService } from './encuestas.service';

describe('EncuestasService', () => {
  let service: EncuestasService;
  let repo: RepoMock;

  type RepoMock = {
    findOne: jest.Mock<Promise<EncuestaPresupuesto | null>, [unknown?]>;
    find: jest.Mock<Promise<EncuestaPresupuesto[]>, [unknown?]>;
    count: jest.Mock<Promise<number>, [unknown?]>;
    create: jest.Mock<
      Partial<EncuestaPresupuesto>,
      [Partial<EncuestaPresupuesto>]
    >;
    save: jest.Mock<
      Promise<Partial<EncuestaPresupuesto>>,
      [Partial<EncuestaPresupuesto>]
    >;
    delete: jest.Mock<Promise<void>, [unknown?]>;
    createQueryBuilder: jest.Mock<unknown, []>;
  };

  beforeEach(async () => {
    const qb = {
      select: () => qb,
      addSelect: () => qb,
      groupBy: () => qb,
      orderBy: () => qb,
      andWhere: () => qb,
      where: () => qb,
      skip: () => qb,
      take: () => qb,
      getRawMany: () => Promise.resolve([] as Array<Record<string, unknown>>),
      getManyAndCount: () =>
        Promise.resolve([[], 0] as [EncuestaPresupuesto[], number]),
    };

    repo = {
      findOne: jest.fn<Promise<EncuestaPresupuesto | null>, [unknown?]>(),
      find: jest.fn<Promise<EncuestaPresupuesto[]>, [unknown?]>(),
      count: jest.fn<Promise<number>, [unknown?]>(),
      create: jest.fn<
        Partial<EncuestaPresupuesto>,
        [Partial<EncuestaPresupuesto>]
      >(),
      save: jest.fn<
        Promise<Partial<EncuestaPresupuesto>>,
        [Partial<EncuestaPresupuesto>]
      >(),
      delete: jest.fn<Promise<void>, [unknown?]>(),
      createQueryBuilder: jest.fn<unknown, []>().mockReturnValue(qb),
    };

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
    repo.findOne.mockResolvedValue({
      id: 1,
      dni: '12345678',
    } as EncuestaPresupuesto);
    const res = await service.validarDni('12.345.678');
    expect(res.puedeContinuar).toBe(false);
  });

  it('guardarEncuesta guarda con estado completada', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((x: Partial<EncuestaPresupuesto>) => x);
    repo.save.mockResolvedValue({
      id: 1,
      estado: 'completada',
      dni: '12345678',
    } as Partial<EncuestaPresupuesto>);

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
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ barrio: 'Centro', cantidad: '2' }]),
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

function mockRedis() {
  return {
    isEnabled: jest.fn(() => false),
    get: jest.fn(),
    setEx: jest.fn(),
    info: jest.fn(),
  };
}
