import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { obterPixCobranca } from "../../../../../lib/asaas";
import { limiteExcedido, registrarUso } from "../../../../../lib/rate-limit";
import { ipDoCliente } from "../../../../../lib/request";

const JANELA_MINUTOS = 10;
const MAX_CONSULTAS = 40;

/** GET /api/pagamentos/[id]/pix — QR code e "copia e cola" pra pagar direto na página da Mova, sem sair pro Asaas. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const chave = `ip:${ipDoCliente(req)}`;
  if (await limiteExcedido("pagamentos-pix", chave, JANELA_MINUTOS, MAX_CONSULTAS)) {
    return NextResponse.json({ error: "Muitas tentativas. Espera um pouco e tenta de novo." }, { status: 429 });
  }
  await registrarUso("pagamentos-pix", chave);

  const { id } = await params;
  const cobranca = await db.cobranca.findUnique({ where: { id }, select: { paga: true, asaasPaymentId: true } });
  if (!cobranca || !cobranca.asaasPaymentId) {
    return NextResponse.json({ error: "Cobrança não encontrada." }, { status: 404 });
  }
  if (cobranca.paga) {
    return NextResponse.json({ error: "Essa cobrança já foi paga." }, { status: 400 });
  }

  const resultado = await obterPixCobranca(cobranca.asaasPaymentId);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json(resultado);
}
