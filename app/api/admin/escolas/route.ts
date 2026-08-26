import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";
import { geocodeEndereco } from "../../../../lib/geo";

const schema = z.object({
  nome: z.string().trim().min(2),
  bairro: z.string().trim().min(2),
  cidade: z.string().trim().min(2),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

/**
 * POST /api/admin/escolas — cadastra escola nova. Antes disso, a única forma
 * de adicionar escola era rodar prisma/seed.ts na VPS — se um pai buscasse
 * uma que não estava na base, não tinha correção rápida.
 *
 * lat/lng são obrigatórios pro cálculo de distância em /api/busca; se o
 * admin não informar manualmente, geocodificamos nome+bairro+cidade.
 */
export async function POST(req: Request) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let lat = data.lat;
  let lng = data.lng;

  if (lat === undefined || lng === undefined) {
    const ponto = await geocodeEndereco(`${data.nome}, ${data.bairro}, ${data.cidade}`);
    if (!ponto) {
      return NextResponse.json(
        { error: "Não conseguimos localizar esse endereço. Tenta um bairro mais específico, ou informe latitude/longitude direto." },
        { status: 400 }
      );
    }
    lat = ponto.lat;
    lng = ponto.lng;
  }

  const escola = await db.escola.create({
    data: { nome: data.nome, bairro: data.bairro, cidade: data.cidade, lat, lng },
  });

  return NextResponse.json({ escola }, { status: 201 });
}
