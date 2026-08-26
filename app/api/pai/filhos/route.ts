import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";

const schema = z.object({
  nome: z.string().min(2),
  escolaId: z.string().min(1),
});

/** POST /api/pai/filhos — o pai cadastra mais um filho, fora do fluxo de contato. */
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

  const escola = await db.escola.findUnique({ where: { id: parsed.data.escolaId }, select: { id: true, nome: true } });
  if (!escola) {
    return NextResponse.json({ error: "Escola não encontrada." }, { status: 404 });
  }

  const nome = parsed.data.nome.trim();

  // Mesma regra de dedupe do /api/leads: mesmo pai, nome e escola não vira
  // registro novo.
  const existente = await db.filho.findFirst({
    where: { paiId: pai.id, escolaId: escola.id, nome: { equals: nome, mode: "insensitive" } },
  });
  if (existente) {
    return NextResponse.json({ filho: { ...existente, escola } });
  }

  const filho = await db.filho.create({ data: { paiId: pai.id, nome, escolaId: escola.id } });

  return NextResponse.json({ filho: { ...filho, escola } }, { status: 201 });
}
