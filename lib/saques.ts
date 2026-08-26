import { db } from "./db";
import { enviarEmail, emailSaqueSolicitadoAdmin, emailSaquePago, urlBase } from "./email";
import { valorRepasseCobranca } from "./financeiro";

/**
 * Saldo/saque do motorista — server-only (toca `db` e `lib/email.ts`).
 * Separado de lib/financeiro.ts de propósito: aquele arquivo é importado
 * por uma página client-side (cadastro do motorista) e não pode arrastar
 * nodemailer pro bundle do navegador.
 */

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Soma das cobranças já pagas pelo Asaas que ainda não foram reservadas por um saque — o que o motorista pode sacar agora. */
export async function saldoDisponivelMotorista(motoristaId: string): Promise<number> {
  const cobrancas = await db.cobranca.findMany({
    where: { paga: true, asaasPaymentId: { not: null }, solicitacaoSaqueId: null, contrato: { motoristaId } },
    include: { contrato: { select: { taxaCentavos: true } } },
  });
  return cobrancas.reduce((soma, cb) => soma + valorRepasseCobranca(cb.valorCentavos, cb.contrato.taxaCentavos), 0);
}

/**
 * Motorista pede pra sacar tudo que está disponível agora — trava o valor
 * no momento do pedido, vinculando as cobranças livres a essa solicitação
 * (elas deixam de contar em saldoDisponivelMotorista pra outro pedido).
 * O Pix em si é manual, fora do Asaas; o admin dá baixa em
 * marcarSaquePago depois de transferir.
 */
export async function criarSolicitacaoSaque(
  motoristaId: string
): Promise<{ ok: true; id: string; valorCentavos: number } | { ok: false; erro: string }> {
  const cobrancas = await db.cobranca.findMany({
    where: { paga: true, asaasPaymentId: { not: null }, solicitacaoSaqueId: null, contrato: { motoristaId } },
    include: { contrato: { select: { taxaCentavos: true } } },
  });
  if (cobrancas.length === 0) {
    return { ok: false, erro: "Nenhum valor disponível pra saque agora." };
  }

  const valorCentavos = cobrancas.reduce((soma, cb) => soma + valorRepasseCobranca(cb.valorCentavos, cb.contrato.taxaCentavos), 0);

  const saque = await db.solicitacaoSaque.create({
    data: {
      motoristaId,
      valorCentavos,
      cobrancas: { connect: cobrancas.map((cb) => ({ id: cb.id })) },
    },
    include: { motorista: { include: { user: { select: { nome: true } } } } },
  });

  try {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    const conteudo = emailSaqueSolicitadoAdmin({
      motoristaNome: saque.motorista.user.nome,
      valorFormatado: formatarReais(valorCentavos),
      link: `${urlBase()}/admin/saques`,
    });
    await Promise.all(admins.map((a) => enviarEmail({ para: a.email, ...conteudo })));
  } catch (err) {
    console.error("Saque solicitado, mas falha ao avisar o admin:", err);
  }

  return { ok: true, id: saque.id, valorCentavos };
}

/** Admin confirma que já fez o Pix manual pro motorista. */
export async function marcarSaquePago(saqueId: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const saque = await db.solicitacaoSaque.findUnique({
    where: { id: saqueId },
    include: { motorista: { include: { user: { select: { nome: true, email: true } } } } },
  });
  if (!saque) return { ok: false, erro: "Solicitação não encontrada." };
  if (saque.status === "PAGO") return { ok: false, erro: "Esse saque já estava marcado como pago." };

  await db.solicitacaoSaque.update({ where: { id: saqueId }, data: { status: "PAGO", pagoEm: new Date() } });

  try {
    await enviarEmail({
      para: saque.motorista.user.email,
      ...emailSaquePago({ nome: saque.motorista.user.nome, valorFormatado: formatarReais(saque.valorCentavos) }),
    });
  } catch (err) {
    console.error("Saque marcado como pago, mas falha ao avisar o motorista:", err);
  }

  return { ok: true };
}
