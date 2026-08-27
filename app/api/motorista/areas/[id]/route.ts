import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { exigirPapel } from "../../../../../lib/auth";

/** DELETE /api/motorista/areas/[id] — remove uma área de atendimento, só do próprio motorista. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const { id } = await params;

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const area = await db.areaAtendimento.findUnique({ where: { id }, select: { motoristaId: true } });
  if (!area || area.motoristaId !== motorista.id) {
    return NextResponse.json({ error: "Área não encontrada." }, { status: 404 });
  }

  await db.areaAtendimento.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
