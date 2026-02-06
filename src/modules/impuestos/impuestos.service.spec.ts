import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpClient } from '../../shared/http/http-client.service';
import { ImpuestosService } from './impuestos.service';

describe('ImpuestosService', () => {
  let service: ImpuestosService;
  let httpClient: {
    post: jest.MockedFunction<
      (
        url: string,
        body?: unknown,
        config?: { headers?: Record<string, string> },
      ) => Promise<unknown>
    >;
    head: jest.MockedFunction<(url: string) => Promise<number>>;
  };

  beforeEach(async () => {
    httpClient = {
      post: jest.fn<
        Promise<unknown>,
        [string, unknown?, { headers?: Record<string, string> }?]
      >(),
      head: jest.fn<Promise<number>, [string]>(),
    };

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
        { provide: HttpClient, useValue: httpClient },
      ],
    }).compile();

    service = module.get<ImpuestosService>(ImpuestosService);
    jest.clearAllMocks();
  });

  it('consulta envia payload como JSON string', async () => {
    httpClient.post.mockResolvedValue({
      RESU: 'OK',
      RESPUESTA: { REGLOG: '1' },
    });

    const res = await service.consulta({ FNC: 'U2' });

    expect(res.RESU).toBe('OK');
    expect(httpClient.post).toHaveBeenCalledTimes(1);

    const firstCall = httpClient.post.mock.calls[0];
    expect(firstCall?.[0]).toBe('https://impuestos.test/api');
    expect(firstCall?.[1]).toBe(JSON.stringify({ FNC: 'U2' }));
    expect(firstCall?.[2]?.headers?.['Content-Type']).toBe('application/json');
    expect(firstCall?.[2]?.headers?.Accept).toBe('application/json');
  });

  it('solicitarCedulon agrega urlPDF', async () => {
    httpClient.post.mockResolvedValue({
      RESU: 'OK',
      RESPUESTA: 'folder/archivo.pdf',
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
    httpClient.post
      .mockResolvedValueOnce({ RESU: 'OK', RESPUESTA: { REGLOG: '99' } })
      .mockResolvedValueOnce({
        RESU: 'OK',
        RESPUESTA: 'https://remote/dashboard/archivo.pdf',
      });
    httpClient.head.mockResolvedValue(200);

    const res = await service.obtenerPdf('123', '1');

    expect(res).toEqual({
      success: true,
      url: 'https://muni.test/dashboard/archivo.pdf',
    });
  });
});
