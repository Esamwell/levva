import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { PRECOS_PILOTO } from "../../../../../../lib/plano";

/**
 * POST /api/motorista/extras/destaque/ativar — contrata o destaque avulso,
 * fora da mensalidade antiga. Fase 1: só registra dentro da plataforma e
 * liga Motorista.destaqueAtivo (o que já é lido de verdade em /api/busca);
 * cobrança real via Asaas é decisão futura.
 */
export async function POST() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true, destaqueAtivo: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }
  if (motorista.destaqueAtivo) {
    return NextResponse.json({ error: "Destaque já está ativo." }, { status: 409 });
  }

  await db.$transaction([
    db.motoristaExtra.create({
      data: {
        motoristaId: motorista.id,
        tipo: "DESTAQUE",
        valorCentavos: PRECOS_PILOTO.DESTAQUE,
        periodicidade: "MENSAL",
      },
    }),
    db.motorista.update({ where: { id: motorista.id }, data: { destaqueAtivo: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
