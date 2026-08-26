import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { gerarCobrancaAsaas } from "../../../../../../lib/asaas";

/** POST /api/admin/contratos/[id]/gerar-cobranca — gera (ou reaproveita) a cobrança Asaas do ciclo atual. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;

  const contrato = await db.contrato.findUnique({
    where: { id },
    include: {
      pai: { include: { user: { select: { nome: true, email: true } } } },
      motorista: { include: { user: { select: { nome: true } } } },
    },
  });
  if (!contrato) {
    return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  }

  const resultado = await gerarCobrancaAsaas(contrato);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json(resultado);
}
