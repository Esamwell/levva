import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { criarAssinaturaAsaas } from "../../../../../../lib/asaas";

/**
 * POST /api/admin/contratos/[id]/criar-assinatura — retry manual pra quando
 * a assinatura automática (criada ao fechar o contrato) falhou (ex.: pai
 * sem CPF/CNPJ na hora). Idempotente: se já tiver assinatura, só devolve ela.
 */
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

  const resultado = await criarAssinaturaAsaas(contrato);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json(resultado);
}
