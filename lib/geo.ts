/**
 * Distância entre pontos e geocoding de endereço.
 *
 * O geocoding é o ponto mais frágil do funil: depende de um serviço externo
 * gratuito acertar o endereço que o pai digitou. Três decisões vêm daí:
 *
 *   1. Cache em banco, por endereço normalizado. Endereços se repetem muito
 *      dentro de um bairro, e o Nominatim pede no máximo 1 consulta por
 *      segundo — com bloqueio por IP quando se passa disso.
 *   2. Dois provedores. O Nominatim recusa boa parte dos IPs de datacenter,
 *      que é exatamente o caso de uma VPS; o Photon (também sobre dados do
 *      OpenStreetMap) costuma responder onde ele não responde.
 *   3. Quem chama precisa saber lidar com `null`. Falhar a busca inteira
 *      porque o endereço não foi reconhecido é perder o pai logo na entrada.
 */

import { db } from "./db";

const EARTH_RADIUS_KM = 6371;
const TIMEOUT_MS = 6000;
const USER_AGENT = "LevvaApp/1.0 (contato@levva.com.br)";

/** Quanto tempo guardamos uma consulta que não achou nada, antes de tentar de novo. */
const TTL_NEGATIVO_HORAS = 24;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------

export type Ponto = { lat: number; lng: number };

/**
 * Monta a consulta. Evita repetir "Salvador" quando o pai já escreveu a
 * cidade — endereço duplicado atrapalha o casamento em ambos os provedores.
 */
function montarConsulta(endereco: string): string {
  const limpo = endereco.trim().replace(/\s+/g, " ");
  const minusculo = limpo.toLowerCase();

  const partes = [limpo];
  if (!minusculo.includes("salvador") && !minusculo.includes("lauro de freitas")) {
    partes.push("Salvador");
  }
  if (!minusculo.includes("bahia") && !/\bba\b/.test(minusculo)) partes.push("Bahia");
  if (!minusculo.includes("brasil") && !minusculo.includes("brazil")) partes.push("Brasil");

  return partes.join(", ");
}

function chaveCache(consulta: string): string {
  return consulta.toLowerCase().replace(/\s+/g, " ").trim();
}

function coordenadaValida(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

async function buscarNominatim(consulta: string): Promise<Ponto | null> {
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Nominatim respondeu ${res.status}`);

  const dados = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!Array.isArray(dados) || dados.length === 0) return null;

  const lat = parseFloat(dados[0].lat);
  const lng = parseFloat(dados[0].lon);
  return coordenadaValida(lat, lng) ? { lat, lng } : null;
}

async function buscarPhoton(consulta: string): Promise<Ponto | null> {
  const url =
    "https://photon.komoot.io/api/" +
    `?limit=1&lang=default&q=${encodeURIComponent(consulta)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Photon respondeu ${res.status}`);

  const dados = (await res.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
  };
  const coords = dados.features?.[0]?.geometry?.coordinates;
  if (!coords) return null;

  // GeoJSON vem como [longitude, latitude] — nessa ordem.
  const [lng, lat] = coords;
  return coordenadaValida(lat, lng) ? { lat, lng } : null;
}

/**
 * Endereço em texto -> coordenadas. Devolve null quando nenhum provedor
 * reconhece o endereço; quem chama decide o que fazer com isso.
 */
export async function geocodeEndereco(endereco: string): Promise<Ponto | null> {
  const consulta = montarConsulta(endereco);
  const chave = chaveCache(consulta);

  // ---- cache ----
  try {
    const guardado = await db.geocodeCache.findUnique({ where: { consulta: chave } });
    if (guardado) {
      if (guardado.encontrado && guardado.lat !== null && guardado.lng !== null) {
        return { lat: guardado.lat, lng: guardado.lng };
      }
      const idade = Date.now() - guardado.criadoEm.getTime();
      if (idade < TTL_NEGATIVO_HORAS * 3600_000) return null;
      // Registro negativo velho: apaga e tenta de novo abaixo.
      await db.geocodeCache.delete({ where: { id: guardado.id } });
    }
  } catch (err) {
    // Cache indisponível não pode impedir a busca — segue direto pros provedores.
    console.error("Falha ao ler cache de geocoding:", err);
  }

  // ---- provedores, em ordem ----
  const provedores: Array<[string, (q: string) => Promise<Ponto | null>]> = [
    ["nominatim", buscarNominatim],
    ["photon", buscarPhoton],
  ];

  let ponto: Ponto | null = null;
  let fonte: string | null = null;

  for (const [nome, buscar] of provedores) {
    try {
      const achado = await buscar(consulta);
      if (achado) {
        ponto = achado;
        fonte = nome;
        break;
      }
      console.warn(`Geocoding: ${nome} não encontrou "${consulta}".`);
    } catch (err) {
      console.error(`Geocoding: ${nome} falhou —`, err instanceof Error ? err.message : err);
    }
  }

  // ---- grava no cache ----
  try {
    await db.geocodeCache.upsert({
      where: { consulta: chave },
      update: {
        lat: ponto?.lat ?? null,
        lng: ponto?.lng ?? null,
        encontrado: ponto !== null,
        fonte,
        criadoEm: new Date(),
      },
      create: {
        consulta: chave,
        lat: ponto?.lat ?? null,
        lng: ponto?.lng ?? null,
        encontrado: ponto !== null,
        fonte,
      },
    });
  } catch (err) {
    console.error("Falha ao gravar cache de geocoding:", err);
  }

  return ponto;
}
