import { db } from "./db";
import { cifrar, decifrar } from "./cripto";

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

type ConfigAsaas = {
  apiKey: string;
  ambiente: "SANDBOX" | "PRODUCAO";
  baseUrl: string;
};

export async function obterConfigAsaas(): Promise<ConfigAsaas | null> {
  const config = await db.configuracaoAsaas.findUnique({ where: { id: "asaas" } });
  if (!config?.apiKeyCifrada) return null;
  return {
    apiKey: decifrar(config.apiKeyCifrada),
    ambiente: config.ambiente,
    baseUrl: BASE_URL[config.ambiente],
  };
}

/** Salva/atualiza a conta configurada. apiKey omitido mantém a chave já salva (só troca ambiente, por exemplo). */
export async function salvarConfigAsaas(dados: { apiKey?: string; ambiente: "SANDBOX" | "PRODUCAO" }) {
  await db.configuracaoAsaas.upsert({
    where: { id: "asaas" },
    create: {
      id: "asaas",
      ambiente: dados.ambiente,
      apiKeyCifrada: dados.apiKey ? cifrar(dados.apiKey) : null,
    },
    update: {
      ambiente: dados.ambiente,
      ...(dados.apiKey ? { apiKeyCifrada: cifrar(dados.apiKey), contaNome: null, contaEmail: null, testadoEm: null } : {}),
    },
  });
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
  if (!config) return { ok: false, erro: "Nenhuma chave configurada." };

  try {
    const res = await asaasFetch("/myAccount/commercialInfo/");
    if (res.status === 401) return { ok: false, erro: "Chave inválida ou sem permissão." };
    if (!res.ok) return { ok: false, erro: `Asaas respondeu ${res.status}.` };

    const dados = await res.json();
    const nome = dados.companyName || dados.name || "Conta sem nome cadastrado";

    await db.configuracaoAsaas.update({
      where: { id: "asaas" },
      data: { contaNome: nome, contaEmail: dados.email ?? null, testadoEm: new Date() },
    });

    return { ok: true, nome, email: dados.email ?? null };
  } catch (err) {
    console.error("Falha ao testar conexão com Asaas:", err);
    return { ok: false, erro: "Não deu pra conectar no Asaas agora. Tenta de novo em instantes." };
  }
}
