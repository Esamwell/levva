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

/**
 * Mostra s\u00f3 os 2 \u00faltimos d\u00edgitos de um telefone, o resto vira \u2022. Usado
 * antes do pagamento da primeira fatura \u2014 pai e motorista s\u00f3 trocam o
 * WhatsApp de verdade depois que o pagamento entra, pra n\u00e3o incentivar
 * fechar por fora e pular a comiss\u00e3o da Mova.
 */
export function mascararTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 2) return "\u2022".repeat(digitos.length);
  return "\u2022".repeat(digitos.length - 2) + digitos.slice(-2);
}
