import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;

  const avaliacao = await db.avaliacao.findUnique({ where: { id }, select: { id: true } });
  if (!avaliacao) {
    return NextResponse.json({ error: "Depoimento não encontrado." }, { status: 404 });
  }

  await db.avaliacao.update({ where: { id }, data: { moderado: true } });

  return NextResponse.json({ ok: true });
}
