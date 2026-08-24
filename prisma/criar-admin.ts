/**
 * Cria (ou atualiza) a conta de administrador.
 *
 * Sem este script não existia nenhuma forma de ter um admin no sistema: o
 * painel de aprovações estava pronto e inacessível, e a fila de motoristas
 * cresceria sem ninguém para processá-la.
 *
 * Rodar com:
 *   ADMIN_EMAIL=voce@exemplo.com ADMIN_SENHA='umaSenhaForte1' npm run criar-admin
 *
 * O instalador da VPS chama isso automaticamente com o que você informar.
 * Se o e-mail já existir, o script troca a senha em vez de duplicar a conta —
 * é também o caminho para recuperar acesso se você perder a senha do admin.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const BCRYPT_ROUNDS = 12;

function erro(mensagem: string): never {
  console.error(`\n  ✗ ${mensagem}\n`);
  process.exit(1);
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA ?? "";
  const nome = (process.env.ADMIN_NOME ?? "Administração Levva").trim();

  if (!email) erro("Defina ADMIN_EMAIL. Ex.: ADMIN_EMAIL=voce@exemplo.com");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erro(`E-mail inválido: ${email}`);
  if (senha.length < 8) erro("ADMIN_SENHA precisa ter pelo menos 8 caracteres.");
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    erro("ADMIN_SENHA precisa ter pelo menos uma letra e um número.");
  }

  const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
  const existente = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existente) {
    if (existente.role !== "ADMIN") {
      erro(
        `Já existe uma conta com ${email}, mas com o papel ${existente.role}. ` +
          `Use outro e-mail para o administrador.`
      );
    }

    await db.$transaction([
      db.user.update({
        where: { id: existente.id },
        data: { senhaHash, senhaAlteradaEm: new Date(), nome },
      }),
      // Trocar a senha derruba as sessões abertas daquela conta.
      db.sessao.deleteMany({ where: { userId: existente.id } }),
    ]);

    console.log(`\n  ✓ Senha do administrador ${email} atualizada.\n`);
    return;
  }

  await db.user.create({
    data: {
      role: "ADMIN",
      nome,
      email,
      senhaHash,
      admin: { create: {} },
    },
  });

  console.log(`\n  ✓ Administrador criado: ${email}`);
  console.log(`    Entre em /entrar com esse e-mail e a senha definida.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
