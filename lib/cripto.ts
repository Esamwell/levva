import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Cifra genérica pra segredo que precisa ficar no banco (não no .env) pra
 * poder ser trocado pela tela do admin sem redeploy — hoje só a chave de
 * API do Asaas (ver ConfiguracaoAsaas). Deriva a chave AES do JWT_SECRET já
 * existente em vez de exigir mais uma variável de ambiente pra configurar:
 * mesmo segredo raiz, subchave própria por causa do "info" fixo abaixo.
 */
// Calculada só no primeiro uso (não no top-level do módulo): JWT_SECRET não
// existe durante o build da imagem Docker (só em runtime, via
// docker-compose), e chamar scryptSync direto no import quebraria o build
// pra qualquer rota que importe isso, mesmo sem nunca ser chamada.
let chaveCache: Buffer | null = null;
function chave(): Buffer {
  if (!chaveCache) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET não configurado. Defina no .env.");
    chaveCache = scryptSync(secret, "mova-segredos-em-repouso", 32);
  }
  return chaveCache;
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chave(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, cifrado]).toString("base64");
}

export function decifrar(base64: string): string {
  const dados = Buffer.from(base64, "base64");
  const iv = dados.subarray(0, 12);
  const tag = dados.subarray(12, 28);
  const cifrado = dados.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", chave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
}
