import { db } from "./db";

/**
 * Limite de taxa genérico, mesma ideia de loginBloqueado()/registrarFalhaLogin()
 * em lib/auth.ts, só que reutilizável em qualquer rota — busca, recuperação
 * de senha, o que precisar. Cada uso escolhe seu próprio `escopo` (evita a
 * contagem de uma rota vazar pra outra) e `janelaMinutos`/`maxTentativas`.
 */
export async function limiteExcedido(
  escopo: string,
  chave: string,
  janelaMinutos: number,
  maxTentativas: number
): Promise<boolean> {
  const desde = new Date(Date.now() - janelaMinutos * 60_000);
  const total = await db.limiteTaxa.count({ where: { escopo, chave, criadaEm: { gte: desde } } });
  return total >= maxTentativas;
}

export async function registrarUso(escopo: string, chave: string): Promise<void> {
  await db.limiteTaxa.create({ data: { escopo, chave } });
}
