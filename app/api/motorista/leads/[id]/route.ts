import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../lib/db";
import { getSession } from "../../../../../lib/auth";

const schema = z.object({
  status: z.enum(["ENCAMINHADO", "EM_NEGOCIACAO", "FECHADO", "NAO_FECHOU"]),
  motivoNaoFechou: z.string().optional(),
});

/** PATCH /api/motorista/leads/:id — motorista atualiza status de um lead seu. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "MOTORISTA") {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const { id } = await params;

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.motoristaId !== motorista.id) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }

  const atualizado = await db.lead.update({
    where: { id },
    data: {
      status: parsed.data.status,
      motivoNaoFechou: parsed.data.motivoNaoFechou,
    },
  });

  return NextResponse.json({ ok: true, lead: atualizado });
}
