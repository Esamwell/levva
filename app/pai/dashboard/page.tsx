/**
 * Histórico de solicitações do pai (leads criados) + status de cada um.
 * Server Component — roda no Node runtime, então pode ler sessão e banco
 * direto, sem precisar de API route intermediária.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { Car, MessageCircle, UserRound } from "lucide-react";
import { exigirPapel } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { StatusBadge } from "../../../components/status-badge";
import { EmptyState } from "../../../components/empty-state";
import AvaliarButton from "./avaliar-button";

export default async function DashboardPaiPage() {
  const session = await exigirPapel("PAI");
  if (!session) redirect("/entrar");

  const pai = await db.pai.findUnique({ where: { userId: session.userId } });

  const leads = pai
    ? await db.lead.findMany({
        where: { paiId: pai.id },
        include: {
          filho: { include: { escola: true } },
          motorista: { include: { user: true } },
          avaliacao: { select: { id: true, nota: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Minhas solicitações</h1>
      <p className="mt-2 text-ink-soft">Acompanhe o andamento das suas solicitações de transporte.</p>

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
            <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white p-5">
              <div>
                <p className="font-semibold text-navy">{lead.motorista.user.nome}</p>
                <p className="text-xs text-ink-soft">
                  {lead.filho.nome} · {lead.filho.escola.nome}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={lead.status} />
                <Link
                  href={`/motoristas/${lead.motoristaId}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-full border border-cream-line px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy"
                >
                  <UserRound className="h-3.5 w-3.5" /> Ver perfil
                </Link>
                <Link
                  href={`/pai/dashboard/${lead.id}`}
                  className="flex items-center gap-1 rounded-full border border-cream-line px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Conversar
                </Link>
                {lead.status === "FECHADO" && (
                  <AvaliarButton
                    leadId={lead.id}
                    motoristaNome={lead.motorista.user.nome}
                    avaliacaoExistente={lead.avaliacao}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
