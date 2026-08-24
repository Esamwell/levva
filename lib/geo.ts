/**
 * Cálculo de distância entre dois pontos (fórmula de Haversine).
 * Usado pra cruzar endereço do pai com região de cobertura do transportador.
 *
 * Fase 1: raio simples em torno do endereço do pai.
 * Fase 2 (se necessário): trocar por PostGIS quando o volume de dados justificar.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Raio padrão de busca em km — ajustável por fase de expansão. */
export const RAIO_BUSCA_PADRAO_KM = 5;

export function dentroDoRaio(
  origem: { lat: number; lng: number },
  destino: { lat: number; lng: number },
  raioKm: number = RAIO_BUSCA_PADRAO_KM
): boolean {
  return distanciaKm(origem.lat, origem.lng, destino.lat, destino.lng) <= raioKm;
}

/**
 * Geocoding de endereço -> lat/lng via Nominatim (OpenStreetMap), grátis.
 *
 * Rate limit da política de uso do Nominatim: 1 req/s, e é obrigatório
 * mandar um User-Agent identificável — sem isso o IP pode ser bloqueado.
 * Se o volume crescer muito, considerar cache em banco (por endereço
 * normalizado) ou trocar por Google Geocoding (pago, mais preciso/rápido).
 */
export async function geocodeEndereco(
  endereco: string
): Promise<{ lat: number; lng: number } | null> {
  const query = `${endereco}, Salvador, Bahia, Brasil`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "LevvaApp/1.0 (contato@levva.com.br)",
    },
  });

  if (!res.ok) return null;

  const resultados = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (resultados.length === 0) return null;

  return { lat: parseFloat(resultados[0].lat), lng: parseFloat(resultados[0].lon) };
}
