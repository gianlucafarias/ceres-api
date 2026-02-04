import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClient } from '../http/http-client.service';

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  constructor(
    private readonly http: HttpClient,
    private readonly config: ConfigService,
  ) {}

  async geocodeAddress(address: string): Promise<{ latitud: number; longitud: number }> {
    const direccionCompleta = `${address}, Ceres, Santa Fe, Argentina`;
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');

    try {
      const data = await this.http.get<GeocodeResponse>(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: direccionCompleta,
            key: apiKey,
            components: 'country:AR',
          },
        },
      );

      if (data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { latitud: lat, longitud: lng };
      }

      return { latitud: -29.884576, longitud: -61.96334 };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al geocodificar: ${message}`);
      throw new Error('Error al geocodificar la direccion.');
    }
  }
}
