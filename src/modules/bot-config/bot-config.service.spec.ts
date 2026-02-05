import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BotConfig } from '../../entities/bot-config.entity';
import { BotConfigService } from './bot-config.service';

describe('BotConfigService', () => {
  let service: BotConfigService;
  let repo: {
    find: jest.MockedFunction<() => Promise<BotConfig[]>>;
    findOne: jest.MockedFunction<(options?: unknown) => Promise<BotConfig | null>>;
    create: jest.MockedFunction<(x: Partial<BotConfig>) => Partial<BotConfig>>;
    save: jest.MockedFunction<(x: Partial<BotConfig>) => Promise<Partial<BotConfig>>>;
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((x: Partial<BotConfig>) => x),
      save: jest.fn(async (x: Partial<BotConfig>) => x),
    };

    const module = await Test.createTestingModule({
      providers: [
        BotConfigService,
        { provide: getRepositoryToken(BotConfig), useValue: repo },
      ],
    }).compile();

    service = module.get(BotConfigService);
  });

  it('crea nueva config', async () => {
    repo.findOne.mockResolvedValue(null);

    const res = await service.create('clave', {
      valor: 'x',
      activo: true,
      fecha_expiracion: null,
    });

    expect(res.clave).toBe('clave');
    expect(res.valor).toBe('x');
  });

  it('lanza conflicto si existe', async () => {
    repo.findOne.mockResolvedValue({ id: 1, clave: 'clave' });

    await expect(
      service.create('clave', { valor: 'x', activo: true, fecha_expiracion: null }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lanza not found si no existe en update', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      service.update('clave', { valor: 'x', activo: true, fecha_expiracion: null }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
