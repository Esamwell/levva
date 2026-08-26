import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";

const schema = z.object({ url: z.string().min(1) });

/** DELETE /api/motorista/galeria — remove uma foto da galeria do próprio perfil. */
export async function DELETE(req: Request) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true, fotos: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  await db.motorista.update({
    where: { id: motorista.id },
    data: { fotos: motorista.fotos.filter((f) => f !== parsed.data.url) },
  });

  return NextResponse.json({ ok: true });
}
