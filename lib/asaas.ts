import { randomBytes } from "crypto";
import { db } from "./db";
import { cifrar, decifrar } from "./cripto";
import { enviarEmail, emailCobrancaGerada, urlBase } from "./email";
import { proximoVencimento } from "./financeiro";
import type { Contrato, Pai } from "@prisma/client";

/**
 * Cliente pra API do Asaas (https://docs.asaas.com/). A conta usada é
 * configurável pelo admin em /admin/configuracoes — nada de chave hardcoded
 * no .env, justamente pra dar pra trocar de conta sem mexer em código nem
 * redeploy (ver ConfiguracaoAsaas no schema).
 *
 * Confirmado na doc oficial em 26/08/2026:
 * - Autenticação: header `access_token`, sem prefixo Bearer.
 * - Base sandbox: https://api-sandbox.asaas.com/v3
 * - Base produção: https://api.asaas.com/v3
 * - Chave de produção começa com $aact_prod_, sandbox com $aact_hmlg_.
 */
const BASE_URL: Record<"SANDBOX" | "PRODUCAO", string> = {
  SANDBOX: "https://api-sandbox.asaas.com/v3",
  PRODUCAO: "https://api.asaas.com/v3",
};

export const PREFIXO_CHAVE: Record<"SANDBOX" | "PRODUCAO", string> = {
  SANDBOX: "$aact_hmlg_",
  PRODUCAO: "$aact_prod_",
};

export type Ambiente = "SANDBOX" | "PRODUCAO";

type ConfigAsaas = {
  apiKey: string;
  ambiente: Ambiente;
  baseUrl: string;
};

/** Configuração do ambiente ativo agora (o que asaasFetch usa de verdade). */
export async function obterConfigAsaas(): Promise<ConfigAsaas | null> {
  const ativo = await db.configuracaoAsaas.findFirst({ where: { ativo: true } });
  if (!ativo?.apiKeyCifrada) return null;
  return {
    apiKey: decifrar(ativo.apiKeyCifrada),
    ambiente: ativo.id,
    baseUrl: BASE_URL[ativo.id],
  };
}

/** As duas linhas (produção e sandbox), pra tela de configurações mostrar status de cada uma. */
export async function listarConfiguracoesAsaas() {
  const linhas = await db.configuracaoAsaas.findMany();
  const porAmbiente = new Map(linhas.map((l) => [l.id, l]));
  return (["SANDBOX", "PRODUCAO"] as const).map((ambiente) => {
    const linha = porAmbiente.get(ambiente);
    return {
      ambiente,
      configurado: !!linha?.apiKeyCifrada,
      ativo: linha?.ativo ?? false,
      contaNome: linha?.contaNome ?? null,
      contaEmail: linha?.contaEmail ?? null,
      testadoEm: linha?.testadoEm ?? null,
    };
  });
}

/** Salva a chave de um ambiente específico — não mexe em qual está ativo. */
export async function salvarChaveAsaas(ambiente: Ambiente, apiKey: string) {
  await db.configuracaoAsaas.upsert({
    where: { id: ambiente },
    create: { id: ambiente, apiKeyCifrada: cifrar(apiKey) },
    update: { apiKeyCifrada: cifrar(apiKey), contaNome: null, contaEmail: null, testadoEm: null },
  });
}

/** Ativa um ambiente (desativa o outro) — trocar não pede a chave de novo. */
export async function ativarAmbienteAsaas(ambiente: Ambiente): Promise<{ ok: true } | { ok: false; erro: string }> {
  const config = await db.configuracaoAsaas.findUnique({ where: { id: ambiente } });
  if (!config?.apiKeyCifrada) {
    return { ok: false, erro: `Cadastra a chave de ${ambiente === "PRODUCAO" ? "produção" : "sandbox"} antes de ativar.` };
  }
  await db.$transaction([
    db.configuracaoAsaas.updateMany({ data: { ativo: false } }),
    db.configuracaoAsaas.update({ where: { id: ambiente }, data: { ativo: true } }),
  ]);
  return { ok: true };
}

/** Chamada autenticada genérica — base pra qualquer integração futura (cobrança, split, etc). */
export async function asaasFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const config = await obterConfigAsaas();
  if (!config) throw new Error("Asaas não configurado.");
  return fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mova (vaidemova.com.br)",
      access_token: config.apiKey,
      ...init.headers,
    },
  });
}

/**
 * Testa a chave configurada consultando os dados comerciais da conta —
 * valida a chave e devolve nome/e-mail da conta ao mesmo tempo, pra dar pra
 * conferir no admin que é a conta certa antes de confiar nela.
 */
export async function testarConexaoAsaas(): Promise<
  { ok: true; nome: string; email: string | null } | { ok: false; erro: string }
> {
  const config = await obterConfigAsaas();
  if (!config) return { ok: false, erro: "Nenhuma chave ativa configurada." };

  try {
    const res = await asaasFetch("/myAccount/commercialInfo/");
    if (res.status === 401) return { ok: false, erro: "Chave inválida ou sem permissão." };
    if (!res.ok) return { ok: false, erro: `Asaas respondeu ${res.status}.` };

    const dados = await res.json();
    const nome = dados.companyName || dados.name || "Conta sem nome cadastrado";

    await db.configuracaoAsaas.update({
      where: { id: config.ambiente },
      data: { contaNome: nome, contaEmail: dados.email ?? null, testadoEm: new Date() },
    });

    return { ok: true, nome, email: dados.email ?? null };
  } catch (err) {
    console.error("Falha ao testar conexão com Asaas:", err);
    return { ok: false, erro: "Não deu pra conectar no Asaas agora. Tenta de novo em instantes." };
  }
}

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Registra (ou substitui) o webhook no Asaas via API, em vez de pedir pro
 * admin configurar na mão no painel deles — gera um token aleatório,
 * cifra e guarda em ConfiguracaoAsaas, e manda pro Asaas junto no cadastro
 * do webhook. Chamado de novo (ex: depois de trocar de conta) simplesmente
 * cria outro webhook com token novo — o Asaas permite mais de um.
 */
export async function configurarWebhookAsaas(emailNotificacao: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const config = await obterConfigAsaas();
  if (!config) return { ok: false, erro: "Configura a chave de API primeiro." };

  const token = randomBytes(32).toString("hex"); // 64 caracteres, dentro do range 32-255 exigido pelo Asaas

  try {
    const res = await asaasFetch("/webhooks", {
      method: "POST",
      body: JSON.stringify({
        name: "Mova - pagamentos",
        url: `${urlBase()}/api/webhooks/asaas`,
        email: emailNotificacao,
        enabled: true,
        interrupted: false,
        apiVersion: 3,
        authToken: token,
        sendType: "SEQUENTIALLY",
        events: ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"],
      }),
    });
    if (!res.ok) {
      const corpo = await res.json().catch(() => null);
      const erro = corpo?.errors?.[0]?.description || `Asaas respondeu ${res.status}.`;
      return { ok: false, erro };
    }

    await db.configuracaoAsaas.update({ where: { id: config.ambiente }, data: { webhookTokenCifrada: cifrar(token) } });
    return { ok: true };
  } catch (err) {
    console.error("Falha ao configurar webhook do Asaas:", err);
    return { ok: false, erro: "Não deu pra registrar o webhook agora. Tenta de novo em instantes." };
  }
}

/** Confere o header asaas-access-token de uma requisição de webhook contra o token que a gente mesmo gerou. */
/**
 * Confere contra o token de QUALQUER ambiente configurado, não só o ativo —
 * um webhook registrado em sandbox continua chegando de lá mesmo depois do
 * admin trocar o ambiente ativo pra produção (são contas Asaas diferentes,
 * cada uma manda pro mesmo endpoint com o token que foi dado a ela).
 */
export async function webhookTokenValido(tokenRecebido: string | null): Promise<boolean> {
  if (!tokenRecebido) return false;
  const linhas = await db.configuracaoAsaas.findMany({ where: { webhookTokenCifrada: { not: null } } });
  return linhas.some((l) => l.webhookTokenCifrada && decifrar(l.webhookTokenCifrada) === tokenRecebido);
}

/** Garante que o pai tem um cliente no Asaas, criando se ainda não tiver — exige CPF/CNPJ já cadastrado. */
async function garantirClienteAsaas(pai: Pai & { user: { nome: string; email: string } }): Promise<string> {
  if (pai.asaasCustomerId) return pai.asaasCustomerId;

  if (!pai.cpfCnpj) {
    throw new Error("Esse responsável ainda não tem CPF/CNPJ cadastrado — preenche em /admin/pais antes de gerar a cobrança.");
  }

  const res = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: pai.user.nome,
      email: pai.user.email,
      cpfCnpj: pai.cpfCnpj,
      externalReference: pai.id,
    }),
  });
  if (!res.ok) {
    const corpo = await res.json().catch(() => null);
    const erro = corpo?.errors?.[0]?.description || `Asaas respondeu ${res.status} ao criar o cliente.`;
    throw new Error(erro);
  }
  const cliente = await res.json();

  await db.pai.update({ where: { id: pai.id }, data: { asaasCustomerId: cliente.id } });
  return cliente.id as string;
}

/**
 * Gera (ou reaproveita) a cobrança Asaas do ciclo atual de um contrato, e
 * avisa o pai por e-mail com o link de pagamento.
 *
 * Quem paga o valor cheio é sempre o pai — a taxa da Mova já está embutida
 * quando pagadorTaxa é PAI (soma no valor cobrado); quando é MOTORISTA, o
 * repasse manual depois é que sai menor (ver marcarRepasseFeito).
 */
export async function gerarCobrancaAsaas(
  contrato: Contrato & { pai: Pai & { user: { nome: string; email: string } }; motorista: { user: { nome: string } } }
): Promise<{ ok: true; linkPagamento: string } | { ok: false; erro: string }> {
  try {
    const ultimaPaga = await db.cobranca.findFirst({
      where: { contratoId: contrato.id, paga: true },
      orderBy: { competencia: "desc" },
    });
    const competencia = ultimaPaga
      ? proximoVencimento(contrato.periodicidade, ultimaPaga.competencia)
      : contrato.createdAt;

    const pendente = await db.cobranca.findFirst({
      where: { contratoId: contrato.id, paga: false, asaasPaymentId: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    if (pendente?.linkPagamento) {
      return { ok: true, linkPagamento: pendente.linkPagamento };
    }

    const clienteId = await garantirClienteAsaas(contrato.pai);

    const valorCobradoCentavos =
      contrato.pagadorTaxa === "PAI" ? contrato.valorCentavos + contrato.taxaCentavos : contrato.valorCentavos;

    const res = await asaasFetch("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: clienteId,
        billingType: "UNDEFINED",
        value: valorCobradoCentavos / 100,
        dueDate: competencia.toISOString().slice(0, 10),
        description: `Transporte escolar — ${contrato.motorista.user.nome} (Mova)`,
        externalReference: contrato.id,
      }),
    });
    if (!res.ok) {
      const corpo = await res.json().catch(() => null);
      const erro = corpo?.errors?.[0]?.description || `Asaas respondeu ${res.status} ao criar a cobrança.`;
      return { ok: false, erro };
    }
    const cobrancaAsaas = await res.json();

    const novaCobranca = await db.cobranca.create({
      data: {
        contratoId: contrato.id,
        competencia,
        valorCentavos: valorCobradoCentavos,
        paga: false,
        asaasPaymentId: cobrancaAsaas.id,
        linkPagamento: cobrancaAsaas.invoiceUrl,
      },
    });

    try {
      await enviarEmail({
        para: contrato.pai.user.email,
        ...emailCobrancaGerada({
          paiNome: contrato.pai.user.nome,
          motoristaNome: contrato.motorista.user.nome,
          valorFormatado: formatarReais(valorCobradoCentavos),
          vencimentoFormatado: competencia.toLocaleDateString("pt-BR"),
          // Página própria da Mova (Pix/boleto embutidos) em vez do checkout
          // hospedado do Asaas direto — ver app/pagar/[id]. O link cru do
          // Asaas ainda fica salvo em linkPagamento pra quem quiser cartão.
          link: `${urlBase()}/pagar/${novaCobranca.id}`,
        }),
      });
    } catch (err) {
      console.error("Cobrança gerada, mas falha ao avisar o pai por e-mail:", err);
    }

    return { ok: true, linkPagamento: cobrancaAsaas.invoiceUrl };
  } catch (err) {
    console.error("Falha ao gerar cobrança Asaas:", err);
    return { ok: false, erro: err instanceof Error ? err.message : "Não deu pra gerar a cobrança agora." };
  }
}

/**
 * QR Code Pix pra exibir direto em /pagar/[id] — em vez de mandar o pai pro
 * checkout hospedado do Asaas, a própria Mova mostra o QR code e o "copia
 * e cola". Sem risco de PCI aqui (nenhum dado de cartão envolvido).
 */
export async function obterPixCobranca(
  asaasPaymentId: string
): Promise<{ ok: true; encodedImage: string; payload: string } | { ok: false; erro: string }> {
  try {
    const res = await asaasFetch(`/payments/${asaasPaymentId}/pixQrCode`);
    if (!res.ok) return { ok: false, erro: `Asaas respondeu ${res.status}.` };
    const dados = await res.json();
    return { ok: true, encodedImage: dados.encodedImage, payload: dados.payload };
  } catch (err) {
    console.error("Falha ao obter QR code Pix:", err);
    return { ok: false, erro: "Não deu pra gerar o QR code agora." };
  }
}

/**
 * Linha digitável + link do PDF do boleto — mesma ideia do Pix acima,
 * mostrado direto na página da Mova. O PDF em si ainda é hospedado pelo
 * Asaas (bankSlipUrl); não tem como evitar isso sem gerar o boleto do zero.
 */
export async function obterBoletoCobranca(
  asaasPaymentId: string
): Promise<{ ok: true; identificationField: string; bankSlipUrl: string | null } | { ok: false; erro: string }> {
  try {
    const [resLinha, resPagamento] = await Promise.all([
      asaasFetch(`/payments/${asaasPaymentId}/identificationField`),
      asaasFetch(`/payments/${asaasPaymentId}`),
    ]);
    if (!resLinha.ok) return { ok: false, erro: `Asaas respondeu ${resLinha.status}.` };
    const linha = await resLinha.json();
    const pagamento = resPagamento.ok ? await resPagamento.json() : null;
    return { ok: true, identificationField: linha.identificationField, bankSlipUrl: pagamento?.bankSlipUrl ?? null };
  } catch (err) {
    console.error("Falha ao obter linha digitável do boleto:", err);
    return { ok: false, erro: "Não deu pra gerar o boleto agora." };
  }
}

/**
 * Chamado pelo webhook (POST /api/webhooks/asaas) quando um pagamento é
 * confirmado/recebido. Só marca a cobrança como paga — ela vira "saldo
 * disponível" pro motorista automaticamente (ver lib/financeiro.ts
 * saldoDisponivelMotorista); o repasse em si só acontece quando o
 * motorista pede o saque, não a cada pagamento confirmado.
 */
export async function confirmarPagamentoAsaas(asaasPaymentId: string, pagoEm: Date): Promise<void> {
  const cobranca = await db.cobranca.findUnique({ where: { asaasPaymentId } });
  if (!cobranca || cobranca.paga) return; // desconhecida ou já processada (idempotência)

  await db.cobranca.update({ where: { id: cobranca.id }, data: { paga: true, pagaEm: pagoEm } });
}
