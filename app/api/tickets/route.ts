import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { enviarEmail, emailNovoTicketAdmin, urlBase } from "../../../lib/email";

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
    include: { autor: { select: { nome: true } } },
  });

  // Leads e extras já avisam o admin por e-mail; chamado novo só aparecia
  // pelo contador no menu, sem sinal nenhum fora da própria plataforma.
  try {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    const conteudo = emailNovoTicketAdmin({
      autorNome: ticket.autor.nome,
      assunto: ticket.assunto,
      link: `${urlBase()}/admin/suporte/${ticket.id}`,
    });
    await Promise.all(admins.map((a) => enviarEmail({ para: a.email, ...conteudo })));
  } catch (err) {
    console.error("Chamado criado, mas falha ao avisar o admin:", err);
  }

  return NextResponse.json({ ok: true, ticketId: ticket.id }, { status: 201 });
}
