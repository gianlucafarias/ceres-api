import axios from 'axios';

interface GeocodeResponse {
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
}

export async function geocodeAddress(address: string): Promise<{ latitud: number; longitud: number }> {
  try {
    const direccionCompleta = `${address}, Ceres, Santa Fe, Argentina`;

    const response = await axios.get<GeocodeResponse>('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: direccionCompleta,
        key: process.env.GOOGLE_MAPS_API_KEY,
        components: 'country:AR',
      },
    });

    const { results } = response.data;
    if (results.length > 0) {
      const { lat, lng } = results[0].geometry.location;
      return { latitud: lat, longitud: lng };
    }

    return { latitud: -29.884576, longitud: -61.96334 };
  } catch (error) {
    console.error('Error al geocodificar la dirección:', error);
    throw new Error('Error al geocodificar la dirección.');
  }
}
