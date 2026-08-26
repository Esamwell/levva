import { redirect } from "next/navigation";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { EmptyState } from "../../../../components/empty-state";
import { TicketStatusBadge } from "../../../../components/ticket-status-badge";
import { NovoChamadoDialog } from "../../../../components/novo-chamado-dialog";

export default async function SuporteMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const tickets = await db.ticket.findMany({
    where: { autorId: session.userId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-navy">Suporte</h1>
          <p className="mt-1 text-ink-soft">Alguma dúvida ou problema? Abra um chamado, a equipe Mova responde por aqui.</p>
        </div>
        <NovoChamadoDialog voltarPara="/motorista/suporte" />
      </div>

      {tickets.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={LifeBuoy} title="Nenhum chamado ainda" description="Abra um chamado quando precisar de ajuda." />
        </div>
      ) : (
        <div className="mt-8 space-y-2.5">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/motorista/suporte/${t.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white p-5 hover:border-amber"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy">{t.assunto}</p>
                <p className="text-xs text-ink-soft">{new Date(t.updatedAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <TicketStatusBadge status={t.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
