/**
 * Modelo de negócio da Mova: sem mensalidade pra ficar listado (decisão
 * confirmada — o antigo lib/plano.ts, com "Plano Básico/Frota", foi
 * aposentado). A Mova ganha uma taxa percentual fixa em cima do valor
 * combinado de cada contrato fechado. Ver prisma/schema.prisma (model
 * Contrato) pro desenho completo.
 *
 * Fixo e igual pra todo mundo por decisão de escopo — se isso virar uma
 * tabela de faixas no futuro, é aqui que a regra muda.
 *
 * Só constantes e funções puras neste arquivo, de propósito — ele é
 * importado por app/motorista/cadastro/page.tsx pra mostrar a taxa durante
 * o cadastro, e esse import chega ao bundle do navegador. Qualquer coisa
 * que toque `db` ou `lib/email.ts` (que puxa nodemailer, que usa módulos
 * nativos do Node) quebra esse build. Ver lib/saques.ts pro lado
 * server-only (saldo, solicitar/marcar saque).
 */
export const TAXA_MOVA_PERCENTUAL = 15;

/** Preço do destaque avulso (ver app/motorista/(painel)/extras) — mesmo valor já usado no modelo antigo. */
export const DESTAQUE_PRECO_CENTAVOS = 3900;

/** Calcula a taxa da Mova (em centavos) sobre um valor combinado, também em centavos. */
export function calcularTaxa(valorCentavos: number, percentual: number = TAXA_MOVA_PERCENTUAL): number {
  return Math.round((valorCentavos * percentual) / 100);
}

export type Periodicidade = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

const MESES_POR_CICLO: Record<Periodicidade, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

/**
 * Calcula o próximo vencimento a partir da última cobrança paga (ou da
 * data do fechamento do contrato, se ainda não teve nenhuma).
 */
export function proximoVencimento(periodicidade: Periodicidade, baseDate: Date): Date {
  const proximo = new Date(baseDate);
  proximo.setMonth(proximo.getMonth() + MESES_POR_CICLO[periodicidade]);
  return proximo;
}

/**
 * O que a Mova cobra do pai via Asaas sempre inclui a taxa da Mova — soma
 * em cima quando é o pai quem paga, já embutida quando é o motorista (ver
 * gerarCobrancaAsaas em lib/asaas.ts). Nos dois casos o motorista recebe o
 * valor cobrado menos a taxa; por isso essa conta não depende de quem paga.
 */
export function valorRepasseCobranca(valorCobradoCentavos: number, taxaCentavos: number): number {
  return valorCobradoCentavos - taxaCentavos;
}
