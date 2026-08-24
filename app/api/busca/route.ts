import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { geocodeEndereco, distanciaKm, RAIO_BUSCA_PADRAO_KM } from "../../../lib/geo";

/**
 * POST /api/busca
 * Recebe endereço (texto) + nome da escola -> geocodifica o endereço,
 * encontra a escola (match por nome, aproximado) e lista motoristas
 * aprovados que atendem essa escola e estão dentro do raio de busca,
 * destaque primeiro.
 */
const schema = z.object({
  endereco: z.string().min(4),
  escola: z.string().min(2),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { endereco, escola } = parsed.data;

  const ponto = await geocodeEndereco(endereco);
  if (!ponto) {
    return NextResponse.json(
      { error: "Não conseguimos localizar esse endereço. Tenta ser mais específico." },
      { status: 422 }
    );
  }

  const escolaEncontrada = await db.escola.findFirst({
    where: { nome: { contains: escola, mode: "insensitive" } },
  });
  if (!escolaEncontrada) {
    return NextResponse.json({ escolaEncontrada: false, escolaId: null, resultados: [] });
  }

  const candidatos = await db.motorista.findMany({
    where: {
      statusAprovacao: "APROVADO",
      escolas: { some: { escolaId: escolaEncontrada.id } },
    },
    include: { user: true, veiculos: true, avaliacoes: true },
  });

  const resultados = candidatos
    .map((m) => ({
      id: m.id,
      nome: m.user.nome,
      destaque: m.destaqueAtivo,
      anosExperiencia: m.anosExperiencia,
      temMonitor: m.temMonitor,
      precoMin: m.precoMin,
      precoMax: m.precoMax,
      notaMedia:
        m.avaliacoes.length > 0
          ? m.avaliacoes.reduce((s, a) => s + a.nota, 0) / m.avaliacoes.length
          : null,
      distanciaKm: distanciaKm(ponto.lat, ponto.lng, escolaEncontrada.lat, escolaEncontrada.lng),
    }))
    .filter((m) => m.distanciaKm <= RAIO_BUSCA_PADRAO_KM)
    .sort((a, b) => Number(b.destaque) - Number(a.destaque) || (b.notaMedia ?? 0) - (a.notaMedia ?? 0));

  return NextResponse.json({
    escolaEncontrada: true,
    escolaId: escolaEncontrada.id,
    resultados,
  });
}
