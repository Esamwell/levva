import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { getSession } from "../../../../../lib/auth";

/** POST /api/tickets/[id]/fechar — autor do chamado ou admin marca como resolvido. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sem sessão." }, { status: 401 });
  }

  const { id } = await params;

  const ticket = await db.ticket.findUnique({ where: { id }, select: { id: true, autorId: true } });
  if (!ticket) {
    return NextResponse.json({ error: "Chamado não encontrado." }, { status: 404 });
  }
  if (ticket.autorId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await db.ticket.update({ where: { id }, data: { status: "FECHADO" } });

  return NextResponse.json({ ok: true });
}
