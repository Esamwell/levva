/**
 * Histórico de solicitações do pai (leads criados) + status de cada um.
 * Server Component — roda no Node runtime, então pode ler sessão e banco
 * direto, sem precisar de API route intermediária.
 */

import { getSession } from "../../../lib/auth";
import { db } from "../../../lib/db";

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO: "Aguardando repasse",
  ENCAMINHADO: "Encaminhado ao motorista",
  EM_NEGOCIACAO: "Em negociação",
  FECHADO: "Fechado",
  NAO_FECHOU: "Não fechou",
};

const STATUS_COLOR: Record<string, string> = {
  AGUARDANDO: "bg-cream-line text-ink-soft",
  ENCAMINHADO: "bg-amber-soft text-navy",
  EM_NEGOCIACAO: "bg-amber-soft text-navy",
  FECHADO: "bg-sage-soft text-sage",
  NAO_FECHOU: "bg-red-50 text-red-600",
};

export default async function DashboardPaiPage() {
  const session = await getSession(); // garantido pelo middleware, mas TS não sabe disso
  const pai = session
    ? await db.pai.findUnique({ where: { userId: session.userId } })
    : null;

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
        <div className="mt-8 rounded-2xl border border-dashed border-cream-line bg-white p-10 text-center text-ink-soft">
          Nenhuma solicitação ainda.{" "}
          <a href="/pai" className="font-semibold text-sage">Buscar transporte →</a>
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
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[lead.status]}`}>
                {STATUS_LABEL[lead.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
