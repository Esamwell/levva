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
/**
 * Detecta tentativa de deixar contato na descrição pública do motorista
 * ("sobre você") — telefone, e-mail, link ou @ de rede social. Não é
 * infalível (dá pra escrever por extenso, "zero sete um..."), mas barra o
 * caso comum e já vem com aviso claro pro motorista não tentar.
 */
export function contemContato(texto: string): boolean {
  const semSeparadores = texto.replace(/[\s().-]/g, "");
  if (/\d{8,}/.test(semSeparadores)) return true;
  if (/[@]/.test(texto)) return true;
  if (/https?:\/\/|www\.|\.com\b|\.com\.br\b/i.test(texto)) return true;
  return false;
}

export function mascararTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 2) return "\u2022".repeat(digitos.length);
  return "\u2022".repeat(digitos.length - 2) + digitos.slice(-2);
}
