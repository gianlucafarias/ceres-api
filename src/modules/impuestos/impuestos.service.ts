import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClient } from '../../shared/http/http-client.service';
import { ConsultarDeudaDto, SolicitarCedulonDto } from './dto/impuestos.dto';

export interface ConsultaResponse {
  RESU: string;
  MENS?: string;
  RESPUESTA: unknown;
  error?: string;
}

export type SolicitarCedulonResponse = ConsultaResponse | { error: string; urlPDF?: string };

type ConsultaPayload = Record<string, unknown> | string;

@Injectable()
export class ImpuestosService {
  private readonly apiUrl: string;
  private readonly muniUrl: string;
  private readonly opeNom: string;
  private readonly opePas: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpClient,
  ) {
    this.apiUrl = this.config.get<string>('IMPUESTOS_API_URL', 'https://mceres-server.dyndns.org/unire_api.php');
    this.muniUrl = this.config.get<string>('IMPUESTOS_MUNI_URL', 'https://mceres-server.dyndns.org/');
    this.opeNom = this.config.get<string>('IMPUESTOS_OPE_NOM', 'PS');
    this.opePas = this.config.get<string>('IMPUESTOS_OPE_PAS', '123456');
  }

  async consulta(payload: ConsultaPayload): Promise<ConsultaResponse> {
    return this.consultaPost(payload);
  }

  async obtenerPdf(partida: string, tipo: string): Promise<{ success?: boolean; url?: string; error?: string }> {
    const primeraConsulta = {
      OPE_NOM: this.opeNom,
      OPE_PAS: this.opePas,
      FNC: 'U2',
      TIPO: tipo,
      PARTIDA: partida,
    };

    const resultado1 = await this.consultaPost(primeraConsulta);
    if (!resultado1 || resultado1.RESU !== 'OK') {
      return { error: resultado1?.MENS || 'Error en la primera consulta' };
    }

    const reglog = this.extractReglog(resultado1.RESPUESTA);
    if (!reglog) {
      return { error: 'No se recibio REGLOG en la respuesta' };
    }

    const segundaConsulta = {
      OPE_NOM: this.opeNom,
      OPE_PAS: this.opePas,
      FNC: 'UW',
      REPORTE: 'RWEB_IU2',
      REGLOG: reglog,
    };

    const resultado2 = await this.consultaPost(segundaConsulta);
    if (!resultado2 || resultado2.RESU !== 'OK') {
      return { error: resultado2?.MENS || 'Error en la segunda consulta' };
    }

    const camino = typeof resultado2.RESPUESTA === 'string' ? resultado2.RESPUESTA : '';
    if (!camino) {
      return { error: 'No se recibio respuesta con la ruta del PDF' };
    }

    const posicionDashboard = camino.indexOf('dashboard');
    if (posicionDashboard === -1) {
      return { error: 'Ruta del PDF no encontrada en la respuesta' };
    }

    const rutaDashboard = camino.substring(posicionDashboard);
    const urlPdf = this.toMuniUrl(rutaDashboard);

    for (let intento = 0; intento < 5; intento += 1) {
      try {
        const status = await this.http.head(urlPdf);
        if (status === 200) {
          return { success: true, url: urlPdf };
        }
      } catch (error: unknown) {
        // continue retry
      }

      if (intento < 4) {
        await this.sleep(1000);
      }
    }

    return { error: 'PDF no generado despues de varios intentos' };
  }

  async consultarDeuda(dto: ConsultarDeudaDto): Promise<ConsultaResponse> {
    const consultaData = {
      OPE_NOM: this.opeNom,
      OPE_PAS: this.opePas,
      FNC: 'T5',
      REGLOG: dto.REGLOG,
      ESTADO: dto.ESTADO,
    };

    return this.consultaPost(consultaData);
  }

  async solicitarCedulon(dto: SolicitarCedulonDto): Promise<ConsultaResponse | { error: string; urlPDF?: string }> {
    const impresionData = {
      OPE_NOM: this.opeNom,
      OPE_PAS: this.opePas,
      FNC: 'UD',
      REGNRO: Number(dto.REGNRO),
    };

    const resultado = await this.consultaPost(impresionData);
    if (!resultado || resultado.RESU !== 'OK') {
      return resultado;
    }

    const rutaPDF = typeof resultado.RESPUESTA === 'string' ? resultado.RESPUESTA : '';
    if (!rutaPDF) {
      return { error: 'No se recibio respuesta con la ruta del PDF' };
    }

    const nombreArchivo = rutaPDF.split('/').pop();
    if (!nombreArchivo) {
      return { error: 'No se pudo extraer el nombre del archivo PDF' };
    }

    const urlPDF = this.toMuniUrl(`dashboard/${nombreArchivo}`);

    return {
      ...resultado,
      urlPDF,
    };
  }

  private async consultaPost(urlData: ConsultaPayload): Promise<ConsultaResponse> {
    try {
      const jsonData = typeof urlData === 'string' ? urlData : JSON.stringify(urlData);

      return await this.http.post<ConsultaResponse, string>(this.apiUrl, jsonData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error en consultaPost';
      return {
        RESU: 'ERROR',
        RESPUESTA: null,
        error: message,
      };
    }
  }

  private extractReglog(respuesta: unknown): string | null {
    if (!this.isRecord(respuesta)) return null;
    const reglog = respuesta.REGLOG;
    return typeof reglog === 'string' ? reglog : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toMuniUrl(path: string): string {
    const base = this.muniUrl.endsWith('/') ? this.muniUrl : `${this.muniUrl}/`;
    if (path.startsWith('/')) {
      return base + path.slice(1);
    }
    return base + path;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
