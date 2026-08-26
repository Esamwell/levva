// Quanto tempo um motorista reprovado precisa esperar antes de poder pedir
// uma nova análise (ver /api/motorista/solicitar-reanalise). Compartilhado
// entre a rota de reprovar (calcula a data-limite pro e-mail) e a própria
// rota de reanálise (valida se já passou).
export const DIAS_ESPERA_REANALISE = 30;

export function dataElegivelReanalise(reprovadoEm: Date): Date {
  return new Date(reprovadoEm.getTime() + DIAS_ESPERA_REANALISE * 24 * 60 * 60 * 1000);
}
