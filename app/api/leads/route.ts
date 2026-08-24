import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { geocodeEndereco } from "../../../lib/geo";
import {
  normalizarTelefone,
  normalizarEmail,
  gerarHashSenha,
  validarForcaSenha,
  criarSessao,
  getSession,
} from "../../../lib/auth";
import { ipDoCliente, userAgentDoCliente } from "../../../lib/request";
import { enviarEmail, emailNovoLeadAdmin, urlBase } from "../../../lib/email";

/**
 * POST /api/leads
 * Cria um lead quando o pai solicita contato com um transportador.
 *
 * Duas entradas:
 *   - Pai já logado: manda só os dados da solicitação.
 *   - Pai novo: manda também nome, e-mail e senha, e a conta é criada aqui,
 *     com sessão aberta em seguida.
 *
 * Antes, a conta do pai nascia escondida dentro deste endpoint — sem senha,
 * sem aceite, sem o pai saber que tinha conta. Agora o cadastro é explícito:
 * a busca segue livre, e a senha só entra na hora de pedir contato.
 *
 * Fase 1: o lead fica AGUARDANDO até o admin repassar manualmente.
 */
const comumSchema = {
  enderecoPai: z.string().min(4),
  nomeFilho: z.string().min(2),
  escolaId: z.string().min(1),
  motoristaId: z.string().min(1),
};

const leadSchema = z.union([
  // Pai novo — cria conta junto.
  z.object({
    ...comumSchema,
    nomePai: z.string().min(2),
    emailPai: z.string().email("E-mail inválido."),
    senha: z.string().min(8),
    telefonePai: z.string().min(10),
  }),
  // Pai já logado — só a solicitação.
  z.object(comumSchema),
]);

export async function POST(req: Request) {
  const parsed = leadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const temCadastro = "emailPai" in data;

  const session = await getSession();

  if (!session && !temCadastro) {
    return NextResponse.json(
      { error: "Faça login ou preencha seus dados para solicitar contato." },
      { status: 401 }
    );
  }
  if (session && session.role !== "PAI") {
    return NextResponse.json(
      { error: "Só uma conta de responsável pode solicitar contato." },
      { status: 403 }
    );
  }

  // A escola e o motorista precisam existir — sem isso a transação estoura
  // no meio e o erro que chega ao pai não diz nada de útil.
  const [escola, motorista] = await Promise.all([
    db.escola.findUnique({ where: { id: data.escolaId }, select: { id: true, nome: true } }),
    db.motorista.findUnique({
      where: { id: data.motoristaId },
      select: { id: true, statusAprovacao: true, user: { select: { nome: true } } },
    }),
  ]);

  if (!escola) {
    return NextResponse.json({ error: "Escola não encontrada." }, { status: 404 });
  }
  if (!motorista || motorista.statusAprovacao !== "APROVADO") {
    return NextResponse.json(
      { error: "Esse transportador não está disponível no momento." },
      { status: 404 }
    );
  }

  const ponto = await geocodeEndereco(data.enderecoPai);
  if (!ponto) {
    return NextResponse.json(
      { error: "Não conseguimos localizar esse endereço." },
      { status: 422 }
    );
  }

  // ---- Resolve o perfil de pai: o da sessão, ou um cadastro novo ----
  let paiId: string;
  let usuarioNovo: { id: string } | null = null;

  if (session) {
    const pai = await db.pai.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!pai) {
      return NextResponse.json({ error: "Perfil de responsável não encontrado." }, { status: 404 });
    }
    paiId = pai.id;
  } else {
    const novo = data as Extract<typeof data, { emailPai: string }>;

    const problemaSenha = validarForcaSenha(novo.senha);
    if (problemaSenha) {
      return NextResponse.json({ error: problemaSenha }, { status: 400 });
    }

    const email = normalizarEmail(novo.emailPai);
    const telefone = normalizarTelefone(novo.telefonePai);

    const jaExiste = await db.user.findFirst({
      where: { OR: [{ email }, { telefone }] },
      select: { id: true },
    });
    if (jaExiste) {
      // Mesma mensagem para e-mail e telefone já usados, e sem dizer com qual
      // papel — separar os casos permitiria descobrir quem tem conta aqui.
      return NextResponse.json(
        { error: "Já existe uma conta com esses dados. Entre em /entrar para continuar." },
        { status: 409 }
      );
    }

    const senhaHash = await gerarHashSenha(novo.senha);

    const criado = await db.user.create({
      data: {
        role: "PAI",
        nome: novo.nomePai,
        email,
        senhaHash,
        telefone,
        pai: { create: { endereco: novo.enderecoPai, lat: ponto.lat, lng: ponto.lng } },
      },
      include: { pai: { select: { id: true } } },
    });

    paiId = criado.pai!.id;
    usuarioNovo = { id: criado.id };
  }

  // ---- Cria filho e lead ----
  const lead = await db.$transaction(async (tx) => {
    const filho = await tx.filho.create({
      data: { paiId, nome: data.nomeFilho, escolaId: escola.id },
    });

    return tx.lead.create({
      data: { paiId, filhoId: filho.id, motoristaId: motorista.id, status: "AGUARDANDO" },
    });
  });

  if (usuarioNovo) {
    await criarSessao(usuarioNovo.id, "PAI", {
      ip: ipDoCliente(req),
      userAgent: userAgentDoCliente(req),
    });
  }

  // Avisa os admins que há lead novo esperando repasse manual. Falha de e-mail
  // não pode derrubar o lead — ele já está gravado e aparece no painel.
  try {
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    if (admins.length > 0) {
      const paiNome = await db.pai.findUnique({
        where: { id: paiId },
        select: { user: { select: { nome: true } } },
      });
      const conteudo = emailNovoLeadAdmin({
        paiNome: paiNome?.user.nome ?? "Responsável",
        motoristaNome: motorista.user.nome,
        filhoNome: data.nomeFilho,
        escolaNome: escola.nome,
        link: `${urlBase()}/admin`,
      });
      await Promise.all(admins.map((a) => enviarEmail({ para: a.email, ...conteudo })));
    }
  } catch (err) {
    console.error("Lead criado, mas falha ao avisar o admin:", err);
  }

  return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 });
}
