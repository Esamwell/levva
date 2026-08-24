/**
 * Contas de demonstração — uma de cada papel, para você conhecer o sistema
 * por dentro antes de ter usuários reais.
 *
 * Cria:
 *   - 1 admin
 *   - 1 pai, com filho matriculado e uma solicitação em aberto
 *   - 1 motorista APROVADO, atendendo todas as escolas do seed, com veículo
 *     e assinatura ativa — assim a busca do pai sempre encontra alguém
 *   - 1 motorista PENDENTE, pra fila de aprovação do admin não ficar vazia
 *   - 1 lead ligando o pai ao motorista aprovado
 *
 * Assim os três painéis abrem com conteúdo de verdade, em vez de telas vazias.
 *
 * Rodar com:  npm run seed:demo
 *
 * É idempotente: rodar de novo atualiza as senhas em vez de duplicar contas.
 *
 * ATENÇÃO: as senhas abaixo são públicas (estão neste arquivo, no repositório).
 * Servem pra explorar o sistema, não pra operar de verdade. Antes de abrir a
 * plataforma pra usuários reais, apague estas contas ou troque as senhas com
 * `npm run criar-admin`.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const ROUNDS = 12;

const CONTAS = {
  admin: { email: "admin@levva.local", senha: "LevvaAdmin2026", nome: "Administração Levva" },
  pai: {
    email: "pai@levva.local",
    senha: "LevvaPai2026",
    nome: "Renata Correia",
    telefone: "5571988880001",
    endereco: "Rua Airosa Galvão, Federação, Salvador",
    lat: -12.9989,
    lng: -38.5063,
    filho: "Bruno Correia",
  },
  motorista: {
    email: "motorista@levva.local",
    senha: "LevvaMotorista2026",
    nome: "Marcos Andrade",
    telefone: "5571988880002",
    cnhNumero: "04512378900",
    cnhCategoria: "D",
  },
  motoristaPendente: {
    email: "pendente@levva.local",
    senha: "LevvaPendente2026",
    nome: "Cláudia Ribeiro",
    telefone: "5571988880003",
    cnhNumero: "07733215600",
    cnhCategoria: "D",
  },
};

async function main() {
  // As escolas vêm do seed principal. Se ainda não rodou, criamos uma mínima
  // pra demo não quebrar — mas o certo é rodar `npm run db:seed` antes.
  // Todas as escolas, não uma amostra: assim a busca do pai encontra o
  // motorista de demonstração seja qual for a escola pesquisada.
  let escolas = await db.escola.findMany({ orderBy: { nome: "asc" } });
  if (escolas.length === 0) {
    console.log("  Nenhuma escola no banco — criando uma pra demo. Rode `npm run db:seed` depois.");
    escolas = [
      await db.escola.create({
        data: { nome: "Colégio Demonstração", bairro: "Barra", cidade: "Salvador", lat: -13.0111, lng: -38.5217 },
      }),
    ];
  }

  // ---------------- ADMIN ----------------
  const a = CONTAS.admin;
  const admin = await db.user.upsert({
    where: { email: a.email },
    update: { senhaHash: await bcrypt.hash(a.senha, ROUNDS), senhaAlteradaEm: new Date() },
    create: { role: "ADMIN", nome: a.nome, email: a.email, senhaHash: await bcrypt.hash(a.senha, ROUNDS) },
  });
  await db.admin.upsert({ where: { userId: admin.id }, update: {}, create: { userId: admin.id } });

  // ---------------- PAI ----------------
  const p = CONTAS.pai;
  const userPai = await db.user.upsert({
    where: { email: p.email },
    update: { senhaHash: await bcrypt.hash(p.senha, ROUNDS), senhaAlteradaEm: new Date() },
    create: {
      role: "PAI",
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      senhaHash: await bcrypt.hash(p.senha, ROUNDS),
    },
  });
  const pai = await db.pai.upsert({
    where: { userId: userPai.id },
    update: {},
    create: { userId: userPai.id, endereco: p.endereco, lat: p.lat, lng: p.lng },
  });

  let filho = await db.filho.findFirst({ where: { paiId: pai.id } });
  if (!filho) {
    filho = await db.filho.create({
      data: { paiId: pai.id, nome: p.filho, escolaId: escolas[0].id },
    });
  }

  // ---------------- MOTORISTA APROVADO ----------------
  const m = CONTAS.motorista;
  const userMot = await db.user.upsert({
    where: { email: m.email },
    update: { senhaHash: await bcrypt.hash(m.senha, ROUNDS), senhaAlteradaEm: new Date() },
    create: {
      role: "MOTORISTA",
      nome: m.nome,
      email: m.email,
      telefone: m.telefone,
      senhaHash: await bcrypt.hash(m.senha, ROUNDS),
    },
  });
  const motorista = await db.motorista.upsert({
    where: { userId: userMot.id },
    update: {},
    create: {
      userId: userMot.id,
      cnhNumero: m.cnhNumero,
      cnhCategoria: m.cnhCategoria,
      cursoTransporte: true,
      antecedentesOk: true,
      statusAprovacao: "APROVADO",
      anosExperiencia: 8,
      temMonitor: true,
      precoMin: 32000, // R$ 320,00
      precoMax: 45000, // R$ 450,00
      destaqueAtivo: true,
    },
  });

  if ((await db.veiculo.count({ where: { motoristaId: motorista.id } })) === 0) {
    await db.veiculo.create({
      data: { motoristaId: motorista.id, placa: "PJZ4A21", modelo: "Renault Master 2019", capacidade: 16 },
    });
  }

  // Atender a escola é o que faz o motorista aparecer na busca daquela escola.
  for (const escola of escolas) {
    await db.motoristaEscola.upsert({
      where: { motoristaId_escolaId: { motoristaId: motorista.id, escolaId: escola.id } },
      update: {},
      create: { motoristaId: motorista.id, escolaId: escola.id },
    });
  }

  await db.assinatura.upsert({
    where: { motoristaId: motorista.id },
    update: {},
    create: {
      motoristaId: motorista.id,
      plano: "FROTA", // 3+ escolas atendidas dispara Frota (ver lib/plano.ts)
      destaque: true,
      status: "ATIVA",
      valorCentavos: 13800, // Frota (9900) + destaque (3900)
      proximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  if ((await db.avaliacao.count({ where: { motoristaId: motorista.id } })) === 0) {
    await db.avaliacao.createMany({
      data: [
        { motoristaId: motorista.id, nota: 5, comentario: "Pontual e atencioso com as crianças.", moderado: true },
        { motoristaId: motorista.id, nota: 4, comentario: "Muito bom, só atrasou uma vez.", moderado: true },
      ],
    });
  }

  // ---------------- MOTORISTA PENDENTE (fila do admin) ----------------
  const mp = CONTAS.motoristaPendente;
  const userPend = await db.user.upsert({
    where: { email: mp.email },
    update: { senhaHash: await bcrypt.hash(mp.senha, ROUNDS), senhaAlteradaEm: new Date() },
    create: {
      role: "MOTORISTA",
      nome: mp.nome,
      email: mp.email,
      telefone: mp.telefone,
      senhaHash: await bcrypt.hash(mp.senha, ROUNDS),
    },
  });
  const motPend = await db.motorista.upsert({
    where: { userId: userPend.id },
    update: {},
    create: {
      userId: userPend.id,
      cnhNumero: mp.cnhNumero,
      cnhCategoria: mp.cnhCategoria,
      statusAprovacao: "PENDENTE",
      anosExperiencia: 3,
    },
  });
  if ((await db.veiculo.count({ where: { motoristaId: motPend.id } })) === 0) {
    await db.veiculo.create({
      data: { motoristaId: motPend.id, placa: "QAB7C33", modelo: "Fiat Ducato 2021", capacidade: 20 },
    });
  }
  await db.assinatura.upsert({
    where: { motoristaId: motPend.id },
    update: {},
    create: { motoristaId: motPend.id, plano: "BASICO", status: "PENDENTE", valorCentavos: 4900 },
  });

  // ---------------- LEAD ----------------
  if ((await db.lead.count({ where: { paiId: pai.id } })) === 0) {
    await db.lead.create({
      data: { paiId: pai.id, filhoId: filho.id, motoristaId: motorista.id, status: "AGUARDANDO" },
    });
  }

  // ---------------- Resumo ----------------
  const linha = "─".repeat(64);
  console.log(`\n${linha}`);
  console.log("  CONTAS DE DEMONSTRAÇÃO CRIADAS");
  console.log(linha);
  for (const [papel, c] of Object.entries(CONTAS)) {
    console.log(`  ${papel.padEnd(18)} ${c.email.padEnd(26)} ${c.senha}`);
  }
  console.log(linha);
  console.log("  Entre em /entrar — o sistema redireciona pro painel certo.");
  console.log("  Estas senhas estão no repositório: troque antes de abrir ao público.");
  console.log(`${linha}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
