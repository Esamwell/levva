import { NextResponse } from "next/server";
import { limiteExcedido, registrarUso } from "../../../lib/rate-limit";
import { ipDoCliente } from "../../../lib/request";

/**
 * GET /api/sugestoes-endereco?q=texto — autocomplete de endereço pra quem
 * está buscando transporte (sem sessão, ver app/pai/busca-client.tsx) e pra
 * quem está preenchendo o próprio endereço no cadastro do lead.
 *
 * Mesma ideia da versão admin (/api/admin/sugestoes-endereco): Photon em vez
 * de Nominatim, que proíbe uso em estilo autocomplete. Essa aqui é pública
 * (sem exigirPapel), então leva rate limit por IP pra não virar proxy aberto
 * pro Photon.
 */
const JANELA_MINUTOS = 10;
const MAX_CONSULTAS = 40;

export async function GET(req: Request) {
  const chave = `ip:${ipDoCliente(req)}`;
  if (await limiteExcedido("sugestoes-endereco", chave, JANELA_MINUTOS, MAX_CONSULTAS)) {
    return NextResponse.json({ sugestoes: [] });
  }
  await registrarUso("sugestoes-endereco", chave);

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ sugestoes: [] });
  }

  const params = new URLSearchParams({
    q,
    limit: "6",
    lat: "-12.9714",
    lon: "-38.5014",
    zoom: "12",
  });

  try {
    const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Photon respondeu ${res.status}`);
    const dados = await res.json();

    const sugestoes = (dados.features ?? [])
      .filter((f: any) => Array.isArray(f.geometry?.coordinates))
      .map((f: any) => {
        const p = f.properties ?? {};
        const [lng, lat] = f.geometry.coordinates;
        const partes = [p.name, p.street, p.district ?? p.locality, p.city].filter(Boolean);
        return { label: partes.join(", "), lat, lng };
      });

    return NextResponse.json({ sugestoes });
  } catch (err) {
    console.error("Falha ao buscar sugestão de endereço pública (Photon):", err);
    return NextResponse.json({ sugestoes: [] });
  }
}
