import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";

/**
 * POST /api/admin/leads/:id/repassar
 *
 * Marca o lead como ENCAMINHADO e grava a data. O repasse em si é manual
 * (o admin fala com o motorista pelo WhatsApp) — o que faltava era registrar
 * que ele aconteceu. Sem isso o lead ficava AGUARDANDO para sempre e o campo
 * `encaminhadoEm` nunca era preenchido, então o admin perdia a conta de quem
 * já tinha sido repassado justamente no passo central do modelo de negócio.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;

  const lead = await db.lead.findUnique({ where: { id }, select: { status: true } });
  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }
  if (lead.status !== "AGUARDANDO") {
    return NextResponse.json({ error: "Esse lead já foi repassado." }, { status: 409 });
  }

  await db.lead.update({
    where: { id },
    data: { status: "ENCAMINHADO", encaminhadoEm: new Date() },
  });

  return NextResponse.json({ ok: true });
}
