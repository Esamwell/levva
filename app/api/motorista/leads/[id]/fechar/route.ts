import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { TAXA_MOVA_PERCENTUAL, calcularTaxa } from "../../../../../../lib/financeiro";

const schema = z.object({
  valorCentavos: z.number().int().positive(),
  periodicidade: z.enum(["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]),
  pagadorTaxa: z.enum(["MOTORISTA", "PAI"]),
});

/**
 * POST /api/motorista/leads/[id]/fechar — marca o lead como FECHADO e cria
 * o Contrato junto (valor combinado, periodicidade, quem paga a taxa da
 * Mova). Rota própria em vez do PATCH genérico porque fechar exige esses
 * dados extra — ver model Contrato em prisma/schema.prisma.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const lead = await db.lead.findUnique({
    where: { id },
    select: { id: true, motoristaId: true, paiId: true, status: true, contrato: { select: { id: true } } },
  });
  if (!lead || lead.motoristaId !== motorista.id) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }
  if (lead.contrato) {
    return NextResponse.json({ error: "Esse lead já tem um contrato registrado." }, { status: 409 });
  }

  const taxaCentavos = calcularTaxa(parsed.data.valorCentavos);

  await db.$transaction([
    db.lead.update({ where: { id }, data: { status: "FECHADO" } }),
    db.contrato.create({
      data: {
        leadId: id,
        motoristaId: motorista.id,
        paiId: lead.paiId,
        valorCentavos: parsed.data.valorCentavos,
        periodicidade: parsed.data.periodicidade,
        pagadorTaxa: parsed.data.pagadorTaxa,
        taxaPercentual: TAXA_MOVA_PERCENTUAL,
        taxaCentavos,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, taxaCentavos });
}
