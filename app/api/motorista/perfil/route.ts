import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";

const schema = z.object({
  anosExperiencia: z.number().int().min(0),
  temMonitor: z.boolean(),
  precoMin: z.number().int().positive().nullable(),
  precoMax: z.number().int().positive().nullable(),
  fotoRosto: z.string().nullable().optional(),
  escolaIds: z.array(z.string()),
  pagadorTaxaPadrao: z.enum(["MOTORISTA", "PAI"]),
});

export async function PUT(req: Request) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil de motorista não encontrado." }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    await tx.motorista.update({
      where: { id: motorista.id },
      data: {
        anosExperiencia: data.anosExperiencia,
        temMonitor: data.temMonitor,
        precoMin: data.precoMin,
        precoMax: data.precoMax,
        pagadorTaxaPadrao: data.pagadorTaxaPadrao,
        ...(data.fotoRosto ? { fotoRosto: data.fotoRosto } : {}),
      },
    });

    // Reconcilia escolas atendidas: apaga o que saiu, cria o que entrou.
    await tx.motoristaEscola.deleteMany({
      where: { motoristaId: motorista.id, escolaId: { notIn: data.escolaIds } },
    });
    const existentes = await tx.motoristaEscola.findMany({
      where: { motoristaId: motorista.id },
      select: { escolaId: true },
    });
    const jaExistentes = new Set(existentes.map((e) => e.escolaId));
    const novas = data.escolaIds.filter((id) => !jaExistentes.has(id));
    if (novas.length > 0) {
      await tx.motoristaEscola.createMany({
        data: novas.map((escolaId) => ({ motoristaId: motorista.id, escolaId })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
