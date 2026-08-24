/**
 * Verificação de sessão que roda no edge runtime.
 *
 * Este arquivo existe separado de lib/auth.ts por um motivo específico: o
 * middleware do Next.js roda em edge, onde o Prisma não funciona — e
 * lib/db.ts instancia o PrismaClient já no topo do módulo. Bastava o
 * middleware importar lib/auth para arrastar Prisma e bcrypt junto e
 * quebrar em produção.
 *
 * Por isso aqui só entra `jose`, que é edge-safe. Nada de banco, nada de
 * bcrypt, nada de node:crypto.
 *
 * O que esta verificação faz é só conferir a assinatura do JWT. Ela não sabe
 * se a sessão foi revogada nem se o papel mudou — quem confirma isso contra
 * o banco é `getSession()`, em lib/auth.ts, chamada dentro de cada página e
 * rota protegida.
 */

import { jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "levva_sessao";

export type Papel = "PAI" | "MOTORISTA" | "ADMIN";

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado. Defina no .env (ver .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export async function getSessionEdge(
  token: string | undefined
): Promise<{ userId: string; role: Papel } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return { userId: payload.sub as string, role: payload.role as Papel };
  } catch {
    return null;
  }
}
