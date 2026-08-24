import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../../lib/db";
import { getSession } from "../../../../../../lib/auth";

const schema = z.object({ motivo: z.string().min(3) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.motorista.update({
    where: { id: (await params).id },
    data: { statusAprovacao: "REPROVADO" },
  });

  // TODO: notificar motorista via WhatsApp com o motivo (parsed.data.motivo)

  return NextResponse.json({ ok: true });
}
