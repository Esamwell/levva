import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { proximoVencimento } from "../../../../../../lib/financeiro";

/**
 * POST /api/motorista/contratos/[id]/cobrancas — motorista marca o ciclo
 * atual do contrato como recebido. Sem Asaas, é manual (ver Cobranca no
 * schema); a "competência" registrada é sempre o vencimento pendente no
 * momento da chamada, calculado a partir da última cobrança (ou da data
 * do fechamento, se essa for a primeira).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const { id } = await params;

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const contrato = await db.contrato.findUnique({
    where: { id },
    // Só cobranças pagas contam pra calcular o próximo ciclo — uma cobrança
    // Asaas gerada mas ainda não paga não pode empurrar a competência.
    include: { cobrancas: { where: { paga: true }, orderBy: { competencia: "desc" }, take: 1 } },
  });
  if (!contrato || contrato.motoristaId !== motorista.id) {
    return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  }

  const competencia = contrato.cobrancas[0]
    ? proximoVencimento(contrato.periodicidade, contrato.cobrancas[0].competencia)
    : contrato.createdAt;

  const cobranca = await db.cobranca.create({
    data: { contratoId: contrato.id, competencia, valorCentavos: contrato.valorCentavos },
  });

  return NextResponse.json({ ok: true, cobrancaId: cobranca.id, competencia: cobranca.competencia });
}
