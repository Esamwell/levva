/**
 * Normaliza texto pra comparação sem acento e sem diferença de
 * maiúscula/minúscula — "Antonio" precisa achar "Colégio Antônio Vieira".
 * O `contains` + `mode: "insensitive"` do Postgres já cobre maiúscula/
 * minúscula, mas não ignora diacrítico; isso aqui resolve o resto.
 */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
