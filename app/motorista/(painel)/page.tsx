import { exigirPapel } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import LeadsList from "./leads-list";
import { EmptyState } from "../../../components/empty-state";

export default async function LeadsMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId } });
  if (!motorista) redirect("/entrar");

  const leads = await db.lead.findMany({
    where: { motoristaId: motorista.id },
    include: { pai: { include: { user: true } }, filho: { include: { escola: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Leads recebidos</h1>
      <p className="mt-1 text-sm text-ink-soft">Famílias que solicitaram contato com você.</p>

      {leads.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Inbox}
            title="Nenhum lead recebido ainda"
            description="Assim que um pai solicitar contato, ele aparece aqui."
          />
        </div>
      ) : (
        <div className="mt-8">
          <LeadsList
            leads={leads.map((l) => ({
              id: l.id,
              status: l.status,
              paiNome: l.pai.user.nome,
              paiTelefone: l.pai.user.telefone,
              filhoNome: l.filho.nome,
              escolaNome: l.filho.escola.nome,
            }))}
          />
        </div>
      )}
    </div>
  );
}
