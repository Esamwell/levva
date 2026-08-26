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
