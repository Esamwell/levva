import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";

/**
 * POST /api/motorista/extras/destaque/cancelar — cancela o destaque,
 * seja ele PENDENTE (desiste antes de pagar) ou ATIVO (desliga o benefício).
 */
export async function POST() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const extra = await db.motoristaExtra.findFirst({
    where: { motoristaId: motorista.id, tipo: "DESTAQUE", status: { in: ["PENDENTE", "ATIVO"] } },
  });
  if (!extra) {
    return NextResponse.json({ error: "Nenhuma contratação de destaque pra cancelar." }, { status: 409 });
  }

  await db.$transaction([
    db.motoristaExtra.update({ where: { id: extra.id }, data: { status: "CANCELADO", canceladoEm: new Date() } }),
    ...(extra.status === "ATIVO"
      ? [db.motorista.update({ where: { id: motorista.id }, data: { destaqueAtivo: false } })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
