import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { geocodeEndereco, distanciaKm, RAIO_BUSCA_PADRAO_KM } from "../../../lib/geo";

/**
 * POST /api/busca
 *
 * Recebe endereço (texto) + nome da escola, encontra a escola e lista os
 * transportadores aprovados que a atendem, destaque primeiro.
 *
 * Sobre o endereço: ele serve pra ordenar e filtrar por proximidade, não pra
 * autorizar nada. Se o geocoding não reconhecer o que o pai digitou, a busca
 * NÃO falha — devolvemos os transportadores da escola sem o filtro de raio e
 * avisamos que a distância não pôde ser calculada.
 *
 * Antes isso devolvia 422 e o pai ficava sem saída logo no primeiro passo do
 * funil, à mercê de um serviço externo gratuito reconhecer a rua dele.
 */
const schema = z.object({
  endereco: z.string().min(4),
  escola: z.string().min(2),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { endereco, escola } = parsed.data;

  const escolaEncontrada = await db.escola.findFirst({
    where: { nome: { contains: escola, mode: "insensitive" } },
  });
  if (!escolaEncontrada) {
    return NextResponse.json({
      escolaEncontrada: false,
      escolaId: null,
      enderecoLocalizado: null,
      resultados: [],
    });
  }

  const ponto = await geocodeEndereco(endereco);

  const candidatos = await db.motorista.findMany({
    where: {
      statusAprovacao: "APROVADO",
      escolas: { some: { escolaId: escolaEncontrada.id } },
    },
    include: { user: true, veiculos: true, avaliacoes: true },
  });

  const mapeados = candidatos.map((m) => ({
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
    distanciaKm: ponto
      ? distanciaKm(ponto.lat, ponto.lng, escolaEncontrada.lat, escolaEncontrada.lng)
      : null,
  }));

  // Sem coordenadas do pai não há como aplicar o raio — mostramos todos os
  // que atendem a escola, que ainda é uma resposta útil.
  const resultados = (ponto
    ? mapeados.filter((m) => (m.distanciaKm ?? Infinity) <= RAIO_BUSCA_PADRAO_KM)
    : mapeados
  ).sort(
    (a, b) =>
      Number(b.destaque) - Number(a.destaque) ||
      (b.notaMedia ?? 0) - (a.notaMedia ?? 0) ||
      (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0)
  );

  return NextResponse.json({
    escolaEncontrada: true,
    escolaId: escolaEncontrada.id,
    escolaNome: escolaEncontrada.nome,
    // O cliente usa isso pra avisar que a lista não está filtrada por distância.
    enderecoLocalizado: ponto !== null,
    resultados,
  });
}
