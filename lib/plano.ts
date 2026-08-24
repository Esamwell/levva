/**
 * Regra de enquadramento de plano do transportador.
 *
 * Básico: 1 veículo E até 2 escolas atendidas.
 * Frota:  mais de 1 veículo OU 3+ escolas atendidas (mesmo com 1 veículo só).
 *
 * O que importa é volume de operação — não só tamanho da frota.
 * Um transportador com 1 van atendendo 5-6 escolas tem uma logística
 * comparável (ou maior) à de quem tem 2 vans com 2 escolas cada.
 */

export type PlanoTipo = "BASICO" | "FROTA";

export function calcularPlanoSugerido(params: {
  numVeiculos: number;
  numEscolas: number;
}): PlanoTipo {
  const { numVeiculos, numEscolas } = params;
  if (numVeiculos > 1 || numEscolas >= 3) return "FROTA";
  return "BASICO";
}

// Preços em centavos — fase piloto (fundadores, mês 1-2)
export const PRECOS_PILOTO = {
  BASICO: 4900,
  FROTA_BASE: 9900,
  FROTA_VEICULO_ADICIONAL: 3500,
  DESTAQUE: 3900,
};

// Preços em centavos — pós-validação (a partir do mês 3-4)
export const PRECOS_PADRAO = {
  BASICO: 7900,
  FROTA_BASE: 14900,
  FROTA_VEICULO_ADICIONAL: 4500,
  DESTAQUE: 5900,
};

export function calcularMensalidade(params: {
  plano: PlanoTipo;
  numVeiculos: number;
  destaque: boolean;
  tabela?: typeof PRECOS_PILOTO;
}): number {
  const { plano, numVeiculos, destaque, tabela = PRECOS_PILOTO } = params;

  let total = 0;
  if (plano === "BASICO") {
    total = tabela.BASICO;
  } else {
    // Frota: se for 1 veículo com 3+ escolas, cobra só a base (sem adicional).
    const veiculosAdicionais = Math.max(0, numVeiculos - 1);
    total = tabela.FROTA_BASE + veiculosAdicionais * tabela.FROTA_VEICULO_ADICIONAL;
  }
  if (destaque) total += tabela.DESTAQUE;
  return total;
}
