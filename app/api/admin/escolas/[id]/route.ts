import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../lib/db";
import { exigirPapel } from "../../../../../lib/auth";
import { geocodeEndereco } from "../../../../../lib/geo";

const schema = z.object({
  nome: z.string().trim().min(2),
  bairro: z.string().trim().min(2),
  cidade: z.string().trim().min(2),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

/** GET — detalhe: quais alunos estão matriculados e quais motoristas atendem essa escola. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;

  const escola = await db.escola.findUnique({
    where: { id },
    include: {
      filhos: {
        include: { pai: { include: { user: { select: { nome: true, telefone: true } } } } },
        orderBy: { nome: "asc" },
      },
      transportadores: {
        include: {
          motorista: {
            include: { user: { select: { nome: true, telefone: true } } },
          },
        },
      },
    },
  });
  if (!escola) {
    return NextResponse.json({ error: "Escola não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    alunos: escola.filhos.map((f) => ({
      id: f.id,
      nome: f.nome,
      paiNome: f.pai.user.nome,
      paiTelefone: f.pai.user.telefone,
    })),
    motoristas: escola.transportadores.map((me) => ({
      id: me.motorista.id,
      nome: me.motorista.user.nome,
      telefone: me.motorista.user.telefone,
      statusAprovacao: me.motorista.statusAprovacao,
    })),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existente = await db.escola.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Escola não encontrada." }, { status: 404 });
  }

  let lat = data.lat;
  let lng = data.lng;

  if (lat === undefined || lng === undefined) {
    // Só re-geocodifica se nome/bairro/cidade realmente mudou — editar só
    // pra corrigir um erro de digitação não deveria arriscar perder a
    // localização certa por causa de uma consulta que falhe.
    const enderecoMudou = existente.nome !== data.nome || existente.bairro !== data.bairro || existente.cidade !== data.cidade;
    if (enderecoMudou) {
      const ponto = await geocodeEndereco(`${data.nome}, ${data.bairro}, ${data.cidade}`);
      if (!ponto) {
        return NextResponse.json(
          { error: "Não conseguimos localizar esse endereço. Tenta um bairro mais específico, ou informe latitude/longitude direto." },
          { status: 400 }
        );
      }
      lat = ponto.lat;
      lng = ponto.lng;
    } else {
      lat = existente.lat;
      lng = existente.lng;
    }
  }

  const escola = await db.escola.update({
    where: { id },
    data: { nome: data.nome, bairro: data.bairro, cidade: data.cidade, lat, lng },
  });

  return NextResponse.json({ escola });
}

/** DELETE — bloqueado pelo próprio banco (RESTRICT) se tiver filho ou motorista vinculado. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await db.escola.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Essa escola tem aluno ou motorista vinculado — não dá pra excluir." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
