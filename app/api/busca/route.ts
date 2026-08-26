import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { geocodeEndereco, distanciaKm, RAIO_BUSCA_PADRAO_KM } from "../../../lib/geo";
import { limiteExcedido, registrarUso } from "../../../lib/rate-limit";
import { ipDoCliente } from "../../../lib/request";
import { normalizarBusca } from "../../../lib/texto";

// GeocodeCache evita bater duas vezes no Nominatim pro mesmo endereço, mas
// endereço variando a cada chamada ainda esgotaria a cota (1 req/s, bloqueio
// por IP) rapidinho. Generoso o bastante pra alguém ajustando a busca várias
// vezes, apertado o bastante pra travar um script.
const JANELA_MINUTOS = 10;
const MAX_BUSCAS = 30;

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
  // Preenchidos quando o pai escolhe uma sugestão do autocomplete de
  // endereço (ver components/endereco-autocomplete.tsx) — evita depender
  // do Nominatim geocodificar o texto de novo aqui.
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(req: Request) {
  const chave = `ip:${ipDoCliente(req)}`;
  if (await limiteExcedido("busca", chave, JANELA_MINUTOS, MAX_BUSCAS)) {
    return NextResponse.json(
      { error: "Muitas buscas em pouco tempo. Espera uns minutinhos e tenta de novo." },
      { status: 429 }
    );
  }
  await registrarUso("busca", chave);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { endereco, escola, lat, lng } = parsed.data;

  // `contains`+`insensitive` do Postgres ignora maiúscula/minúscula, mas não
  // acento — "Antonio" não achava "Antônio". Base de escolas é pequena
  // (dezenas), então filtra em memória em vez de mexer com extensão do
  // banco (unaccent) só pra isso.
  const termoBusca = normalizarBusca(escola);
  const todasEscolas = await db.escola.findMany();
  const escolaEncontrada = todasEscolas.find((e) => normalizarBusca(e.nome).includes(termoBusca));
  if (!escolaEncontrada) {
    return NextResponse.json({
      escolaEncontrada: false,
      escolaId: null,
      enderecoLocalizado: null,
      resultados: [],
    });
  }

  const ponto = lat !== undefined && lng !== undefined ? { lat, lng } : await geocodeEndereco(endereco);

  const candidatos = await db.motorista.findMany({
    where: {
      statusAprovacao: "APROVADO",
      // Motorista desativado pelo admin some da busca mesmo já aprovado.
      user: { ativo: true },
      escolas: { some: { escolaId: escolaEncontrada.id } },
    },
    include: { user: true, veiculos: true, avaliacoes: true },
  });

  const mapeados = candidatos.map((m) => {
    // Só avaliação aprovada pelo admin entra na média pública — sem isso,
    // um depoimento ainda pendente de moderação já pesava no ranking.
    const aprovadas = m.avaliacoes.filter((a) => a.moderado);
    return {
      id: m.id,
      nome: m.user.nome,
      destaque: m.destaqueAtivo,
      anosExperiencia: m.anosExperiencia,
      temMonitor: m.temMonitor,
      precoMin: m.precoMin,
      precoMax: m.precoMax,
      notaMedia: aprovadas.length > 0 ? aprovadas.reduce((s, a) => s + a.nota, 0) / aprovadas.length : null,
      distanciaKm: ponto
        ? distanciaKm(ponto.lat, ponto.lng, escolaEncontrada.lat, escolaEncontrada.lng)
        : null,
    };
  });

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
