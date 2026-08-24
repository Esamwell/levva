import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { getSession } from "../../../../../../lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const motorista = await db.motorista.update({
    where: { id: (await params).id },
    data: { statusAprovacao: "APROVADO", antecedentesOk: true },
  });

  // Assinatura vira ativa junto — é a aprovação que libera o motorista
  // pra aparecer nas buscas, e é isso que justifica cobrar a mensalidade.
  await db.assinatura.updateMany({
    where: { motoristaId: motorista.id, status: "PENDENTE" },
    data: { status: "ATIVA", proximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  // TODO: notificar motorista via WhatsApp que foi aprovado

  return NextResponse.json({ ok: true });
}
