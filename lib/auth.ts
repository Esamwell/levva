/**
 * Autenticação por OTP via WhatsApp (sem senha).
 * Fluxo: usuário digita telefone -> recebe código de 6 dígitos via WhatsApp
 * -> confirma -> sessão criada (JWT assinado em cookie httpOnly).
 *
 * O envio real do WhatsApp depende das credenciais da WhatsApp Cloud API
 * (Meta for Developers). Sem elas configuradas (dev local), o código cai
 * no console do servidor — dá pra testar o fluxo inteiro sem gastar nada.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomInt, createHash } from "crypto";
import { db } from "./db";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "levva_sessao";
const OTP_TTL_MINUTOS = 10;
const SESSAO_TTL_DIAS = 30;

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET não configurado. Defina no .env (ver .env.example)."
    );
  }
  return new TextEncoder().encode(secret);
}

function hashCodigo(codigo: string): string {
  return createHash("sha256").update(codigo).digest("hex");
}

/** Normaliza telefone pra dígitos apenas, com DDI 55 se faltando. */
export function normalizarTelefone(telefone: string): string {
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 11) digitos = "55" + digitos;
  return digitos;
}

export type Session = {
  userId: string;
  role: Role;
} | null;

/**
 * Gera um código de 6 dígitos, salva o hash no banco (expira em 10 min)
 * e envia via WhatsApp Cloud API. Em dev sem credenciais, loga no console.
 */
export async function enviarCodigoOtp(telefoneBruto: string): Promise<void> {
  const telefone = normalizarTelefone(telefoneBruto);
  const codigo = randomInt(100000, 999999).toString();

  await db.codigoOtp.create({
    data: {
      telefone,
      codigoHash: hashCodigo(codigo),
      expiraEm: new Date(Date.now() + OTP_TTL_MINUTOS * 60_000),
    },
  });

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    // Dev/local: sem credenciais configuradas ainda.
    console.log(`[OTP dev] Código pra ${telefone}: ${codigo}`);
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefone,
        type: "text",
        text: { body: `Seu código Levva é ${codigo}. Vale por ${OTP_TTL_MINUTOS} minutos.` },
      }),
    }
  );

  if (!res.ok) {
    const detalhe = await res.text();
    throw new Error(`Falha ao enviar OTP via WhatsApp: ${detalhe}`);
  }
}

/**
 * Confirma o código, cria sessão (cookie httpOnly) e retorna o Session.
 * Retorna null se o código for inválido/expirado/já usado, ou se o
 * usuário ainda não existir (cadastro precisa ter sido feito antes).
 */
export async function confirmarCodigoOtp(
  telefoneBruto: string,
  codigo: string
): Promise<Session> {
  const telefone = normalizarTelefone(telefoneBruto);
  const codigoHash = hashCodigo(codigo);

  const registro = await db.codigoOtp.findFirst({
    where: { telefone, codigoHash, usado: false, expiraEm: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!registro) return null;

  await db.codigoOtp.update({ where: { id: registro.id }, data: { usado: true } });

  const user = await db.user.findUnique({ where: { telefone } });
  if (!user) return null;

  const jwt = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSAO_TTL_DIAS}d`)
    .sign(jwtSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSAO_TTL_DIAS * 24 * 60 * 60,
    path: "/",
  });

  return { userId: user.id, role: user.role };
}

export async function encerrarSessao(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Usado por Server Components/Route Handlers (runtime Node, não edge). */
export async function getSession(): Promise<Session> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return { userId: payload.sub as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** Versão edge-safe (usada só pelo middleware.ts, que roda em edge runtime). */
export async function getSessionEdge(token: string | undefined): Promise<Session> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return { userId: payload.sub as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
