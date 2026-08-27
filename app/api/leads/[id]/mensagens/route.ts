import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../lib/db";
import { getSession } from "../../../../../lib/auth";
import { enviarEmail, emailNovaMensagemLead, urlBase } from "../../../../../lib/email";

const schema = z.object({ corpo: z.string().trim().min(1).max(4000) });

/**
 * POST /api/leads/[id]/mensagens — pai ou motorista do lead manda mensagem
 * pro outro. Sem conceito de "encerrar" (ao contrário do Ticket de
 * suporte) — a conversa fica aberta durante e depois do contrato, pra
 * combinar rotina.
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

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      pai: { select: { userId: true, user: { select: { nome: true, email: true } } } },
      motorista: { select: { userId: true, user: { select: { nome: true, email: true } } } },
      filho: { select: { nome: true } },
    },
  });
  if (!lead) {
    return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }

  const ehPai = lead.pai.userId === session.userId;
  const ehMotorista = lead.motorista.userId === session.userId;
  if (!ehPai && !ehMotorista) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await db.leadMensagem.create({ data: { leadId: id, autorId: session.userId, corpo: parsed.data.corpo } });

  const destinatario = ehPai ? lead.motorista.user : lead.pai.user;
  const remetenteNome = ehPai ? lead.pai.user.nome : lead.motorista.user.nome;
  const link = ehPai
    ? `${urlBase()}/motorista/leads/${id}`
    : `${urlBase()}/pai/dashboard/${id}`;

  try {
    await enviarEmail({
      para: destinatario.email,
      ...emailNovaMensagemLead({
        destinatarioNome: destinatario.nome,
        remetenteNome,
        filhoNome: lead.filho.nome,
        link,
      }),
    });
  } catch (err) {
    console.error("Mensagem enviada, mas falha ao avisar o destinatário por e-mail:", err);
  }

  return NextResponse.json({ ok: true });
}
