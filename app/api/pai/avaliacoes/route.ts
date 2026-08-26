import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";

const schema = z.object({
  leadId: z.string().min(1),
  nota: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional(),
});

/**
 * POST /api/pai/avaliacoes — o pai avalia o motorista de uma solicitação
 * fechada. Fica pendente (moderado: false) até um admin aprovar em
 * /admin/depoimentos; só depois entra na média pública (ver /api/busca).
 */
export async function POST(req: Request) {
  const session = await exigirPapel("PAI");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de responsável." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pai = await db.pai.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!pai) {
    return NextResponse.json({ error: "Perfil de responsável não encontrado." }, { status: 404 });
  }

  const lead = await db.lead.findUnique({
    where: { id: parsed.data.leadId },
    select: { id: true, paiId: true, motoristaId: true, status: true, avaliacao: { select: { id: true } } },
  });

  if (!lead || lead.paiId !== pai.id) {
    return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }
  if (lead.status !== "FECHADO") {
    return NextResponse.json({ error: "Só dá pra avaliar depois que a van for contratada." }, { status: 400 });
  }
  if (lead.avaliacao) {
    return NextResponse.json({ error: "Você já avaliou essa contratação." }, { status: 409 });
  }

  const avaliacao = await db.avaliacao.create({
    data: {
      motoristaId: lead.motoristaId,
      paiId: pai.id,
      leadId: lead.id,
      nota: parsed.data.nota,
      comentario: parsed.data.comentario || null,
    },
  });

  return NextResponse.json({ ok: true, avaliacaoId: avaliacao.id }, { status: 201 });
}
