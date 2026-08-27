import { NextResponse } from "next/server";
import { webhookTokenValido, confirmarPagamentoAsaas, processarPagamentoCriadoAsaas } from "../../../../lib/asaas";

/**
 * POST /api/webhooks/asaas — sem sessão (o Asaas não manda cookie nenhum),
 * autenticado pelo header `asaas-access-token` contra o token que a gente
 * mesmo gerou ao registrar o webhook (ver configurarWebhookAsaas).
 *
 * Reage a três eventos — o resto da lista longa é ignorado silenciosamente,
 * mas sempre com 200: o Asaas reenvia e pode até suspender a fila se um
 * evento voltar erro.
 * - PAYMENT_CREATED: o Asaas gerou sozinho a cobrança do ciclo de uma
 *   assinatura recorrente — é aqui que a Cobranca local nasce e o pai é
 *   avisado, sem ninguém do time precisar clicar em nada.
 * - PAYMENT_CONFIRMED/PAYMENT_RECEIVED: marca a cobrança como paga.
 */
export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (!(await webhookTokenValido(token))) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const corpo = await req.json().catch(() => null);
  const evento = corpo?.event as string | undefined;
  const pagamento = corpo?.payment;

  if (evento === "PAYMENT_CREATED" && pagamento?.id) {
    await processarPagamentoCriadoAsaas(pagamento);
  }

  if ((evento === "PAYMENT_CONFIRMED" || evento === "PAYMENT_RECEIVED") && pagamento?.id) {
    const pagoEm = pagamento.paymentDate ? new Date(pagamento.paymentDate) : new Date();
    await confirmarPagamentoAsaas(pagamento.id, pagoEm);
  }

  return NextResponse.json({ ok: true });
}
