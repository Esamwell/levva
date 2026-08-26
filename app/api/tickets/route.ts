import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { getSession } from "../../../lib/auth";

const schema = z.object({
  assunto: z.string().trim().min(3).max(140),
  mensagem: z.string().trim().min(3).max(4000),
});

/** POST /api/tickets — pai ou motorista abre um chamado com a primeira mensagem. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "PAI" && session.role !== "MOTORISTA")) {
    return NextResponse.json({ error: "Sem sessão de pai ou motorista." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ticket = await db.ticket.create({
    data: {
      autorId: session.userId,
      assunto: parsed.data.assunto,
      mensagens: { create: { autorId: session.userId, corpo: parsed.data.mensagem } },
    },
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id }, { status: 201 });
}
