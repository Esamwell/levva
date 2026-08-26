import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";

/** DELETE /api/motorista/video — remove o vídeo de apresentação do próprio perfil. */
export async function DELETE() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  await db.motorista.update({ where: { id: motorista.id }, data: { videoUrl: null } });

  return NextResponse.json({ ok: true });
}
