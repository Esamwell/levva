import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";

/** POST /api/motorista/extras/destaque/cancelar — desliga o destaque avulso. */
export async function POST() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true, destaqueAtivo: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }
  if (!motorista.destaqueAtivo) {
    return NextResponse.json({ error: "Destaque já está desativado." }, { status: 409 });
  }

  await db.$transaction([
    db.motoristaExtra.updateMany({
      where: { motoristaId: motorista.id, tipo: "DESTAQUE", status: "ATIVO" },
      data: { status: "CANCELADO", canceladoEm: new Date() },
    }),
    db.motorista.update({ where: { id: motorista.id }, data: { destaqueAtivo: false } }),
  ]);

  return NextResponse.json({ ok: true });
}
