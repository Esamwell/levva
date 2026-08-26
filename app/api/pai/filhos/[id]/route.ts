import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../lib/db";
import { exigirPapel } from "../../../../../lib/auth";

const schema = z.object({
  nome: z.string().min(2),
  escolaId: z.string().min(1),
});

/** PUT /api/pai/filhos/[id] — o pai corrige nome ou escola de um filho já cadastrado. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("PAI");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de responsável." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pai = await db.pai.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!pai) {
    return NextResponse.json({ error: "Perfil de responsável não encontrado." }, { status: 404 });
  }

  const filho = await db.filho.findUnique({ where: { id }, select: { id: true, paiId: true } });
  if (!filho || filho.paiId !== pai.id) {
    return NextResponse.json({ error: "Filho não encontrado." }, { status: 404 });
  }

  const escola = await db.escola.findUnique({ where: { id: parsed.data.escolaId }, select: { id: true, nome: true } });
  if (!escola) {
    return NextResponse.json({ error: "Escola não encontrada." }, { status: 404 });
  }

  const atualizado = await db.filho.update({
    where: { id },
    data: { nome: parsed.data.nome.trim(), escolaId: escola.id },
  });

  return NextResponse.json({ filho: { ...atualizado, escola } });
}
