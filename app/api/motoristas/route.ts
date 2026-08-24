import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { normalizarTelefone, enviarCodigoOtp } from "../../../lib/auth";
import { calcularPlanoSugerido, calcularMensalidade, PRECOS_PILOTO } from "../../../lib/plano";

/**
 * POST /api/motoristas
 * Cria o cadastro de um motorista novo vindo do fluxo público de
 * /motorista/cadastro: User(role=MOTORISTA) + Motorista(statusAprovacao=
 * PENDENTE) + Veiculo(s) + Assinatura(status=PENDENTE, calculada pela
 * mesma regra de lib/plano.ts). Documentos já chegam como URLs (upload
 * feito antes, via /api/upload).
 *
 * Ao final, dispara o envio do código OTP — o motorista sai do cadastro
 * já podendo confirmar e acessar o painel (mesmo em análise).
 */
const veiculoSchema = z.object({
  placa: z.string().min(6),
  modelo: z.string().min(2),
  capacidade: z.number().int().positive(),
});

const bodySchema = z.object({
  nome: z.string().min(3),
  telefone: z.string().min(10),
  cidade: z.string().min(2),
  cnhNumero: z.string().min(4),
  cnhCategoria: z.string().min(1),
  numEscolasInformado: z.number().int().positive(),
  destaqueDesejado: z.boolean(),
  veiculos: z.array(veiculoSchema).min(1),
  documentos: z.object({
    cnhUrl: z.string().min(1),
    cursoUrl: z.string().min(1),
    antecedentesUrl: z.string().min(1),
    crlvUrl: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const telefone = normalizarTelefone(data.telefone);

  const existente = await db.user.findUnique({ where: { telefone } });
  if (existente) {
    return NextResponse.json(
      { error: "Já existe um cadastro com esse telefone. Faça login em /entrar." },
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

  const motorista = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { role: "MOTORISTA", nome: data.nome, telefone },
    });

    const motorista = await tx.motorista.create({
      data: {
        userId: user.id,
        cnhNumero: data.cnhNumero,
        cnhCategoria: data.cnhCategoria,
        cnhDocUrl: data.documentos.cnhUrl,
        cursoDocUrl: data.documentos.cursoUrl,
        antecedentesDocUrl: data.documentos.antecedentesUrl,
        cursoTransporte: true, // documento anexado, aguardando conferência humana
        antecedentesOk: false, // só vira true quando o admin confere de fato
        statusAprovacao: "PENDENTE",
        destaqueAtivo: false, // só ativa quando a assinatura for confirmada
        veiculos: {
          create: data.veiculos.map((v) => ({
            placa: v.placa,
            modelo: v.modelo,
            capacidade: v.capacidade,
            fotoUrl: data.documentos.crlvUrl,
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

    return motorista;
  });

  try {
    await enviarCodigoOtp(telefone);
  } catch (err) {
    console.error("Cadastro criado mas falha ao enviar OTP:", err);
    // Não derruba o cadastro por isso — motorista pode pedir novo código em /entrar.
  }

  return NextResponse.json({ ok: true, motoristaId: motorista.id }, { status: 201 });
}
