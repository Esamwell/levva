import { NextResponse } from "next/server";
import { exigirPapel } from "../../../../lib/auth";

/**
 * GET /api/admin/sugestoes-endereco?q=texto — autocomplete de endereço/nome
 * de lugar pro formulário de escola em /admin/escolas.
 *
 * Usa o Photon (komoot.io, dados OpenStreetMap), não o Nominatim que o
 * resto do app usa pra geocoding pontual — os termos de uso do Nominatim
 * proíbem explicitamente uso em estilo autocomplete (consulta a cada letra
 * digitada). Photon é feito pra isso, gratuito, sem chave.
 *
 * Fica atrás de sessão de admin — não é rota pública, e evita expor o
 * proxy pra abuso de quem não devia estar usando.
 */
export async function GET(req: Request) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ sugestoes: [] });
  }

  // Viés pro centro de Salvador — melhora a relevância pra endereço local
  // sem restringir a busca só a essa região.
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
        return {
          label: partes.join(", "),
          nome: p.name ?? "",
          bairro: p.district ?? p.locality ?? "",
          cidade: p.city ?? "Salvador",
          lat,
          lng,
        };
      });

    return NextResponse.json({ sugestoes });
  } catch (err) {
    console.error("Falha ao buscar sugestão de endereço (Photon):", err);
    return NextResponse.json({ sugestoes: [] });
  }
}
