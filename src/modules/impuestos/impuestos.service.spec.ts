import axios from 'axios';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ImpuestosService } from './impuestos.service';

jest.mock('axios', () => ({
  post: jest.fn(),
  head: jest.fn(),
}));

describe('ImpuestosService', () => {
  let service: ImpuestosService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ImpuestosService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const values: Record<string, string> = {
                IMPUESTOS_API_URL: 'https://impuestos.test/api',
                IMPUESTOS_MUNI_URL: 'https://muni.test/',
                IMPUESTOS_OPE_NOM: 'PS',
                IMPUESTOS_OPE_PAS: '123456',
              };
              return values[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ImpuestosService);
    jest.clearAllMocks();
  });

  it('consulta envia payload como JSON string', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { RESU: 'OK', RESPUESTA: { REGLOG: '1' } },
    });

    const res = await service.consulta({ FNC: 'U2' });

    expect(res.RESU).toBe('OK');
    expect(axios.post).toHaveBeenCalledWith(
      'https://impuestos.test/api',
      JSON.stringify({ FNC: 'U2' }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      }),
    );
  });

  it('solicitarCedulon agrega urlPDF', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { RESU: 'OK', RESPUESTA: 'folder/archivo.pdf' },
    });

    const res = await service.solicitarCedulon({ REGNRO: 123 });

    expect(res).toEqual(
      expect.objectContaining({
        RESU: 'OK',
        urlPDF: 'https://muni.test/dashboard/archivo.pdf',
      }),
    );
  });

  it('obtenerPdf retorna url cuando head es 200', async () => {
    (axios.post as jest.Mock)
      .mockResolvedValueOnce({
        data: { RESU: 'OK', RESPUESTA: { REGLOG: '99' } },
      })
      .mockResolvedValueOnce({
        data: { RESU: 'OK', RESPUESTA: 'https://remote/dashboard/archivo.pdf' },
      });
    (axios.head as jest.Mock).mockResolvedValue({ status: 200 });

    const res = await service.obtenerPdf('123', '1');

    expect(res).toEqual({ success: true, url: 'https://muni.test/dashboard/archivo.pdf' });
  });
});
