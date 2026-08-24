/**
 * Autenticação por e-mail e senha, para os três papéis (pai, motorista, admin).
 *
 * Como funciona:
 *   1. A senha é guardada como hash bcrypt — nunca em claro, nunca em SHA-256
 *      (hash rápido demais serve pra integridade, não pra senha).
 *   2. Ao entrar, criamos uma linha em `Sessao` e assinamos um JWT que carrega
 *      só o id dela. Assim dá pra derrubar sessão de verdade: apagou a linha,
 *      o token vira inválido na hora, sem esperar os 7 dias expirarem.
 *   3. O middleware roda em edge runtime e não alcança o banco, então lá a
 *      verificação é só do JWT (portão barato). Quem confirma a sessão contra
 *      o banco é `getSession()`, usada por Server Components e rotas de API.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { Role } from "@prisma/client";

import { SESSION_COOKIE_NAME as COOKIE_NAME } from "./session-edge";

const SESSAO_TTL_DIAS = 7;
const BCRYPT_ROUNDS = 12;

/** Janela e teto do bloqueio por tentativas de login falhas. */
export const LOGIN_MAX_TENTATIVAS = 5;
export const LOGIN_JANELA_MINUTOS = 15;

const RECUPERACAO_TTL_MINUTOS = 60;

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado. Defina no .env (ver .env.example).");
  }
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

/** E-mail é o identificador de login — sempre minúsculo e sem espaço em volta. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Normaliza telefone pra dígitos apenas, com DDI 55 se faltando. */
export function normalizarTelefone(telefone: string): string {
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 11) digitos = "55" + digitos;
  return digitos;
}

// ---------------------------------------------------------------------------
// Senha
// ---------------------------------------------------------------------------

/** Regra mínima de senha. Devolve a mensagem do problema, ou null se estiver ok. */
export function validarForcaSenha(senha: string): string | null {
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(senha)) return "A senha precisa ter pelo menos uma letra.";
  if (!/[0-9]/.test(senha)) return "A senha precisa ter pelo menos um número.";
  return null;
}

export async function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, BCRYPT_ROUNDS);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

// ---------------------------------------------------------------------------
// Limite de tentativas
// ---------------------------------------------------------------------------

function desdeQuando(): Date {
  return new Date(Date.now() - LOGIN_JANELA_MINUTOS * 60_000);
}

/**
 * Conta falhas recentes de uma chave (e-mail ou IP). Bloqueia acima do teto.
 * Contamos os dois separadamente: o e-mail protege a conta específica, o IP
 * impede varrer muitas contas diferentes a partir do mesmo lugar.
 */
export async function loginBloqueado(chaves: string[]): Promise<boolean> {
  const falhas = await db.tentativaLogin.groupBy({
    by: ["chave"],
    where: { chave: { in: chaves }, criadaEm: { gte: desdeQuando() } },
    _count: { chave: true },
  });
  return falhas.some((f) => f._count.chave >= LOGIN_MAX_TENTATIVAS);
}

export async function registrarFalhaLogin(chaves: string[]): Promise<void> {
  await db.tentativaLogin.createMany({ data: chaves.map((chave) => ({ chave })) });
}

export async function limparFalhasLogin(chaves: string[]): Promise<void> {
  await db.tentativaLogin.deleteMany({ where: { chave: { in: chaves } } });
}

/**
 * Faxina das tabelas que só crescem: tentativas de login fora da janela e
 * sessões já vencidas.
 *
 * Roda por amostragem (≈10% dos logins) de propósito. Rodar em todo login
 * significaria um DELETE varrendo a tabela a cada tentativa — trabalho de
 * escrita que não se paga, já que nada quebra se a limpeza acontecer alguns
 * logins depois.
 */
export async function faxinaEventual(): Promise<void> {
  if (Math.random() > 0.1) return;
  try {
    await Promise.all([
      db.tentativaLogin.deleteMany({ where: { criadaEm: { lt: desdeQuando() } } }),
      db.sessao.deleteMany({ where: { expiraEm: { lt: new Date() } } }),
    ]);
  } catch (err) {
    // Faxina é oportunista: se falhar, o login não pode falhar junto.
    console.error("Falha na limpeza de tentativas/sessões:", err);
  }
}

// ---------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------

export type Session = {
  userId: string;
  role: Role;
  sessaoId: string;
} | null;

/**
 * Cria a sessão no banco e grava o cookie httpOnly assinado.
 * Chamado depois de conferir a senha — nunca antes.
 */
export async function criarSessao(
  userId: string,
  role: Role,
  contexto?: { userAgent?: string | null; ip?: string | null }
): Promise<void> {
  const expiraEm = new Date(Date.now() + SESSAO_TTL_DIAS * 24 * 60 * 60 * 1000);

  const sessao = await db.sessao.create({
    data: {
      userId,
      expiraEm,
      userAgent: contexto?.userAgent ?? null,
      ip: contexto?.ip ?? null,
    },
  });

  const jwt = await new SignJWT({ role, sid: sessao.id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
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
}

/** Encerra a sessão atual: apaga a linha do banco e limpa o cookie. */
export async function encerrarSessao(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, jwtSecret());
      const sid = payload.sid as string | undefined;
      if (sid) await db.sessao.deleteMany({ where: { id: sid } });
    } catch {
      // Token ilegível: não há sessão pra apagar, só limpar o cookie.
    }
  }

  store.delete(COOKIE_NAME);
}

/** Derruba todas as sessões de um usuário (troca de senha, remoção de acesso). */
export async function encerrarTodasSessoes(userId: string): Promise<void> {
  await db.sessao.deleteMany({ where: { userId } });
}

/**
 * Sessão confirmada contra o banco. Usar em Server Components e rotas de API —
 * é a verificação que vale, porque pega sessão revogada e senha trocada.
 */
export async function getSession(): Promise<Session> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let sid: string | undefined;
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    sid = payload.sid as string | undefined;
  } catch {
    return null;
  }
  if (!sid) return null;

  const sessao = await db.sessao.findUnique({
    where: { id: sid },
    include: { user: { select: { id: true, role: true } } },
  });

  if (!sessao || sessao.expiraEm < new Date()) return null;

  // O papel vem do banco, não do token — assim rebaixar alguém tem efeito imediato.
  return { userId: sessao.user.id, role: sessao.user.role, sessaoId: sessao.id };
}

/** Atalho pra rotas que exigem um papel específico. */
export async function exigirPapel(role: Role): Promise<Session> {
  const session = await getSession();
  if (!session || session.role !== role) return null;
  return session;
}

// ---------------------------------------------------------------------------
// Recuperação de senha
// ---------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Gera o token de redefinição e devolve o valor em claro, que só vai existir
 * dentro do link enviado por e-mail — no banco fica apenas o hash.
 * Devolve null se o e-mail não tiver conta (quem chama não deve revelar isso).
 */
export async function criarTokenRecuperacao(
  emailBruto: string
): Promise<{ token: string; nome: string; email: string } | null> {
  const email = normalizarEmail(emailBruto);
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;

  // Um pedido novo invalida os anteriores.
  await db.tokenRecuperacao.updateMany({
    where: { userId: user.id, usado: false },
    data: { usado: true },
  });

  const token = randomBytes(32).toString("hex");
  await db.tokenRecuperacao.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiraEm: new Date(Date.now() + RECUPERACAO_TTL_MINUTOS * 60_000),
    },
  });

  return { token, nome: user.nome, email: user.email };
}

/**
 * Troca a senha usando o token do e-mail. Ao concluir, derruba todas as
 * sessões abertas daquele usuário — se a conta foi invadida, redefinir a
 * senha precisa expulsar quem estava dentro.
 */
export async function redefinirSenhaComToken(
  token: string,
  senhaNova: string
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const problema = validarForcaSenha(senhaNova);
  if (problema) return { ok: false, erro: problema };

  const registro = await db.tokenRecuperacao.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!registro || registro.usado || registro.expiraEm < new Date()) {
    return { ok: false, erro: "Esse link expirou ou já foi usado. Peça outro." };
  }

  const senhaHash = await gerarHashSenha(senhaNova);

  await db.$transaction([
    db.tokenRecuperacao.update({ where: { id: registro.id }, data: { usado: true } }),
    db.user.update({
      where: { id: registro.userId },
      data: { senhaHash, senhaAlteradaEm: new Date() },
    }),
    db.sessao.deleteMany({ where: { userId: registro.userId } }),
  ]);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * Confere e-mail e senha. Devolve o usuário ou null, sem dizer qual dos dois
 * estava errado — distinguir "e-mail não existe" de "senha errada" entrega
 * quais contas existem.
 *
 * Quando o e-mail não existe, ainda assim rodamos um bcrypt descartável: sem
 * isso, a resposta volta rápido demais e o tempo de resposta denuncia a conta.
 */
const HASH_FALSO = "$2a$12$Ck6xVQ8gG1sVw0oR6t3vZeQ9mYhKjLxNpBvRtWzXcYdEfGhIjKlMn";

export async function autenticar(
  emailBruto: string,
  senha: string
): Promise<{ id: string; role: Role } | null> {
  const email = normalizarEmail(emailBruto);
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true, senhaHash: true },
  });

  if (!user) {
    await conferirSenha(senha, HASH_FALSO);
    return null;
  }

  const confere = await conferirSenha(senha, user.senhaHash);
  if (!confere) return null;

  return { id: user.id, role: user.role };
}

/** Para onde mandar cada papel depois de entrar. */
export function destinoPorPapel(role: Role): string {
  if (role === "PAI") return "/pai/dashboard";
  if (role === "MOTORISTA") return "/motorista";
  return "/admin";
}

// Reexportados de session-edge.ts, que é o módulo que o middleware importa.
export { SESSION_COOKIE_NAME, getSessionEdge } from "./session-edge";
