import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";
import { TicketStatusBadge } from "../../../../components/ticket-status-badge";
import { TicketThread } from "../../../../components/ticket-thread";

export default async function ChamadoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) redirect("/entrar");

  const { id } = await params;

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      autor: { select: { nome: true, role: true, motorista: { select: { id: true } }, pai: { select: { id: true } } } },
      mensagens: { orderBy: { createdAt: "asc" }, include: { autor: { select: { role: true } } } },
    },
  });

  if (!ticket) notFound();

  const perfilHref = ticket.autor.motorista
    ? `/admin/motoristas/${ticket.autor.motorista.id}`
    : ticket.autor.pai
    ? `/admin/pais/${ticket.autor.pai.id}`
    : null;

  return (
    <div>
      <Link href="/admin/suporte" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
        <ArrowLeft className="h-4 w-4" />
        Suporte
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-navy">{ticket.assunto}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {perfilHref ? (
              <Link href={perfilHref} className="font-semibold text-sage hover:underline">
                {ticket.autor.nome}
              </Link>
            ) : (
              ticket.autor.nome
            )}
          </p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <div className="mt-6 rounded-2xl border border-cream-line bg-white p-5">
        <TicketThread
          ticketId={ticket.id}
          status={ticket.status}
          podeEncerrar
          mensagens={ticket.mensagens.map((m) => {
            const mine = m.autorId === session.userId;
            return {
              id: m.id,
              corpo: m.corpo,
              createdAt: m.createdAt.toISOString(),
              mine,
              isAdmin: m.autor.role === "ADMIN",
              // "Você" só quando foi este admin que respondeu — outro admin
              // que responder aparece como "Equipe Mova", não como "Você".
              label: m.autor.role === "ADMIN" ? (mine ? "Você" : "Equipe Mova") : ticket.autor.nome,
            };
          })}
        />
      </div>
    </div>
  );
}
