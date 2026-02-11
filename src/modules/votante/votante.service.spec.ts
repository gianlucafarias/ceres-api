import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Votante } from '../../entities/votante.entity';
import { VotanteService } from './votante.service';

describe('VotanteService', () => {
  let service: VotanteService;
  let repo: {
    findOne: jest.MockedFunction<(input: unknown) => Promise<Votante | null>>;
    clear: jest.MockedFunction<() => Promise<void>>;
    create: jest.MockedFunction<(input: Partial<Votante>) => Votante>;
    save: jest.MockedFunction<
      (input: Votante[], options?: unknown) => Promise<Votante[]>
    >;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      clear: jest.fn(),
      create: jest.fn((input: Partial<Votante>) => input as Votante),
      save: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        VotanteService,
        { provide: getRepositoryToken(Votante), useValue: repo },
      ],
    }).compile();

    service = module.get(VotanteService);
  });

  it('obtiene votante por documento y devuelve contrato bot', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      mesa: '2555',
      orden: '001',
      nombre: 'Juan Perez',
      direccion: 'Av. Siempre Viva 123',
      documento: '12345678',
      clase: '',
      anioNacimiento: '',
      provincia: '',
      departamento: '',
      localidad: '',
    });

    const result = await service.obtenerPorDocumento('12.345.678');

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { documento: '12345678' },
    });
    expect(result).toEqual({
      mesa: '2555',
      nombre: 'Juan Perez',
      documento: '12345678',
      orden: '001',
      direccion: 'Av. Siempre Viva 123',
    });
  });

  it('devuelve error cuando no encuentra votante', async () => {
    repo.findOne.mockResolvedValue(null);

    const result = await service.obtenerPorDocumento('12345678');

    expect(result).toEqual({
      documento: '12345678',
      error: 'No se encontro informacion electoral para el DNI 12345678.',
    });
  });

  it('importa y reemplaza votantes cuando se solicita', async () => {
    repo.save.mockResolvedValue([]);

    const result = await service.importar({
      reemplazar: true,
      registros: [
        {
          mesa: '1',
          orden: '2',
          nombre: 'Nombre',
          direccion: 'Direccion',
          documento: '11111111',
          clase: 'A',
          anioNacimiento: '1990',
          provincia: 'Santa Fe',
          departamento: 'San Cristobal',
          localidad: 'Ceres',
        },
      ],
    });

    expect(repo.clear).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      inserted: 1,
      replaced: true,
    });
  });
});
