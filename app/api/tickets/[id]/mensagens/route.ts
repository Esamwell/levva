import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../lib/db";
import { getSession } from "../../../../../lib/auth";

const schema = z.object({ corpo: z.string().trim().min(1).max(4000) });

/**
 * POST /api/tickets/[id]/mensagens — autor do chamado ou admin responde.
 * Mensagem do autor sempre devolve o chamado pra ABERTO (reabre se estava
 * FECHADO); mensagem do admin marca RESPONDIDO — reflete de quem é a vez.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sem sessão." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ticket = await db.ticket.findUnique({ where: { id }, select: { id: true, autorId: true } });
  if (!ticket) {
    return NextResponse.json({ error: "Chamado não encontrado." }, { status: 404 });
  }

  const ehAutor = ticket.autorId === session.userId;
  const ehAdmin = session.role === "ADMIN";
  if (!ehAutor && !ehAdmin) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await db.$transaction([
    db.ticketMensagem.create({ data: { ticketId: id, autorId: session.userId, corpo: parsed.data.corpo } }),
    db.ticket.update({ where: { id }, data: { status: ehAdmin ? "RESPONDIDO" : "ABERTO" } }),
  ]);

  return NextResponse.json({ ok: true });
}
