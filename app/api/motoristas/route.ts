import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import {
  normalizarTelefone,
  normalizarEmail,
  gerarHashSenha,
  validarForcaSenha,
  criarSessao,
} from "../../../lib/auth";
import { ipDoCliente, userAgentDoCliente } from "../../../lib/request";
import { calcularPlanoSugerido, calcularMensalidade, PRECOS_PILOTO } from "../../../lib/plano";

/**
 * POST /api/motoristas
 *
 * Cria a conta do motorista vinda do fluxo público de /motorista/cadastro:
 * User(role=MOTORISTA) + Motorista(PENDENTE) + Veiculo(s) + Assinatura(PENDENTE),
 * e já abre a sessão.
 *
 * Os documentos NÃO vêm aqui. A conta é criada primeiro justamente pra que os
 * uploads seguintes aconteçam autenticados (ver /api/upload) — cada arquivo
 * fica amarrado ao dono, e a rota de upload deixa de aceitar arquivo de
 * qualquer um. Enquanto os documentos não chegam, o cadastro fica PENDENTE e
 * o motorista não aparece nas buscas.
 */
const veiculoSchema = z.object({
  placa: z.string().min(6),
  modelo: z.string().min(2),
  capacidade: z.number().int().positive(),
});

const bodySchema = z.object({
  nome: z.string().min(3),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(8),
  telefone: z.string().min(10),
  cidade: z.string().min(2),
  cnhNumero: z.string().min(4),
  cnhCategoria: z.string().min(1),
  numEscolasInformado: z.number().int().positive(),
  destaqueDesejado: z.boolean(),
  veiculos: z.array(veiculoSchema).min(1),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const problemaSenha = validarForcaSenha(data.senha);
  if (problemaSenha) {
    return NextResponse.json({ error: problemaSenha }, { status: 400 });
  }

  const email = normalizarEmail(data.email);
  const telefone = normalizarTelefone(data.telefone);

  const existente = await db.user.findFirst({
    where: { OR: [{ email }, { telefone }] },
    select: { email: true },
  });
  if (existente) {
    return NextResponse.json(
      { error: "Já existe uma conta com esse e-mail ou telefone. Entre em /entrar." },
      { status: 409 }
    );
  }

  const plano = calcularPlanoSugerido({
    numVeiculos: data.veiculos.length,
    numEscolas: data.numEscolasInformado,
  });
  const valorCentavos = calcularMensalidade({
    plano,
    numVeiculos: data.veiculos.length,
    destaque: data.destaqueDesejado,
    tabela: PRECOS_PILOTO,
  });

  const senhaHash = await gerarHashSenha(data.senha);

  const criado = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { role: "MOTORISTA", nome: data.nome, email, senhaHash, telefone },
    });

    const motorista = await tx.motorista.create({
      data: {
        userId: user.id,
        cnhNumero: data.cnhNumero,
        cnhCategoria: data.cnhCategoria,
        // Ambos só viram true quando o admin confere os documentos de fato.
        cursoTransporte: false,
        antecedentesOk: false,
        statusAprovacao: "PENDENTE",
        destaqueAtivo: false, // só ativa quando a assinatura for confirmada
        veiculos: {
          create: data.veiculos.map((v) => ({
            placa: v.placa,
            modelo: v.modelo,
            capacidade: v.capacidade,
          })),
        },
        assinatura: {
          create: {
            plano,
            destaque: data.destaqueDesejado,
            status: "PENDENTE",
            valorCentavos,
          },
        },
      },
    });

    return { user, motorista };
  });

  // Sessão aberta na sequência: os documentos sobem logo depois, e o upload
  // exige estar autenticado.
  await criarSessao(criado.user.id, "MOTORISTA", {
    ip: ipDoCliente(req),
    userAgent: userAgentDoCliente(req),
  });

  return NextResponse.json({ ok: true, motoristaId: criado.motorista.id }, { status: 201 });
}
