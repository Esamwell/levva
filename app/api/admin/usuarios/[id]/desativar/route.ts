import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel, encerrarTodasSessoes } from "../../../../../../lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;

  // Guarda simples pra não se trancar fora da própria conta.
  if (id === session.userId) {
    return NextResponse.json({ error: "Você não pode desativar sua própria conta." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  await db.user.update({ where: { id }, data: { ativo: false } });
  // Desativar derruba sessões abertas na hora, não só bloqueia login novo.
  await encerrarTodasSessoes(id);

  return NextResponse.json({ ok: true });
}
