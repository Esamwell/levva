/**
 * Modelo de comissão em avaliação: sem mensalidade pra ficar listado, a Mova
 * ganha uma taxa percentual fixa em cima do valor combinado de cada contrato
 * fechado. Ver prisma/schema.prisma (model Contrato) pro desenho completo.
 *
 * Fixo e igual pra todo mundo por decisão de escopo — se isso virar uma
 * tabela de faixas no futuro, é aqui que a regra muda.
 */
export const TAXA_MOVA_PERCENTUAL = 15;

/** Calcula a taxa da Mova (em centavos) sobre um valor combinado, também em centavos. */
export function calcularTaxa(valorCentavos: number, percentual: number = TAXA_MOVA_PERCENTUAL): number {
  return Math.round((valorCentavos * percentual) / 100);
}

const MESES_POR_CICLO: Record<"MENSAL" | "TRIMESTRAL" | "ANUAL", number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  ANUAL: 12,
};

/**
 * Sem Asaas ainda, não existe cobrança automática — o motorista marca cada
 * ciclo como recebido manualmente (ver Cobranca no schema e
 * POST /api/motorista/contratos/[id]/cobrancas). Essa função calcula o
 * próximo vencimento a partir da última cobrança registrada (ou da data do
 * fechamento do contrato, se ainda não teve nenhuma).
 */
export function proximoVencimento(
  periodicidade: "MENSAL" | "TRIMESTRAL" | "ANUAL",
  baseDate: Date
): Date {
  const proximo = new Date(baseDate);
  proximo.setMonth(proximo.getMonth() + MESES_POR_CICLO[periodicidade]);
  return proximo;
}
