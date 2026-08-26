import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { exigirPapel } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { TicketStatusBadge } from "../../../../../components/ticket-status-badge";
import { TicketThread } from "../../../../../components/ticket-thread";

export default async function ChamadoMotoristaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const { id } = await params;

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { mensagens: { orderBy: { createdAt: "asc" }, include: { autor: { select: { role: true } } } } },
  });

  if (!ticket || ticket.autorId !== session.userId) notFound();

  return (
    <div>
      <Link href="/motorista/suporte" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
        <ArrowLeft className="h-4 w-4" />
        Suporte
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">{ticket.assunto}</h1>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <div className="mt-6 rounded-2xl border border-cream-line bg-white p-5">
        <TicketThread
          ticketId={ticket.id}
          status={ticket.status}
          podeEncerrar
          mensagens={ticket.mensagens.map((m) => ({
            id: m.id,
            corpo: m.corpo,
            createdAt: m.createdAt.toISOString(),
            mine: m.autorId === session.userId,
            isAdmin: m.autor.role === "ADMIN",
            label: m.autor.role === "ADMIN" ? "Equipe Mova" : "Você",
          }))}
        />
      </div>
    </div>
  );
}
