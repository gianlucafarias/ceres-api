import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { CertificadosService } from './certificados.service';

describe('CertificadosService', () => {
  let service: CertificadosService;
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'certificados-test-'));

    const module = await Test.createTestingModule({
      providers: [
        CertificadosService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => {
              if (key === 'MODIFIED_CERTIFICATES_PATH') return outputDir;
              return fallback;
            },
          },
        },
      ],
    }).compile();

    service = module.get(CertificadosService);
  });

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  it('crea certificado con URL estable por documento', async () => {
    const firstPath = await service.crear({
      name: 'Juan Perez',
      documentNumber: '12.345.678',
    });
    const secondPath = await service.crear({
      name: 'Juan Perez Modificado',
      documentNumber: '12.345.678',
    });

    expect(firstPath).toBe('/modified_certificates/certificado-12345678.pdf');
    expect(secondPath).toBe('/modified_certificates/certificado-12345678.pdf');

    const buffer = await readFile(join(outputDir, 'certificado-12345678.pdf'));
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('falla cuando documentNumber es invalido', async () => {
    await expect(
      service.crear({
        name: 'Nombre Valido',
        documentNumber: 'abc',
      }),
    ).rejects.toThrow('documentNumber invalido');
  });
});
