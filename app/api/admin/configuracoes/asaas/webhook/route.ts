import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { configurarWebhookAsaas } from "../../../../../../lib/asaas";

/** POST — registra o webhook de pagamentos no Asaas via API (nada de configurar na mão no painel deles). */
export async function POST() {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const admin = await db.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  if (!admin) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const resultado = await configurarWebhookAsaas(admin.email);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
