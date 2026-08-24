/**
 * Histórico de solicitações do pai (leads criados) + status de cada um.
 * Server Component — roda no Node runtime, então pode ler sessão e banco
 * direto, sem precisar de API route intermediária.
 */

import { redirect } from "next/navigation";
import { Car } from "lucide-react";
import { exigirPapel } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { StatusBadge } from "../../../components/status-badge";
import { EmptyState } from "../../../components/empty-state";

export default async function DashboardPaiPage() {
  const session = await exigirPapel("PAI");
  if (!session) redirect("/entrar");

  const pai = await db.pai.findUnique({ where: { userId: session.userId } });

  const leads = pai
    ? await db.lead.findMany({
        where: { paiId: pai.id },
        include: { filho: { include: { escola: true } }, motorista: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Minhas solicitações</h1>
      <p className="mt-2 text-ink-soft">Acompanhe o status dos transportadores que você contatou.</p>

      {leads.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Car}
            title="Nenhuma solicitação ainda"
            description="Busque um transportador verificado pra começar."
            action={{ label: "Buscar transporte", href: "/pai" }}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between rounded-2xl border border-cream-line bg-white p-5">
              <div>
                <p className="font-semibold text-navy">{lead.motorista.user.nome}</p>
                <p className="text-xs text-ink-soft">
                  {lead.filho.nome} · {lead.filho.escola.nome}
                </p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
