import { exigirPapel } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import LeadsList from "./leads-list";
import { EmptyState } from "../../../components/empty-state";
import { TAXA_MOVA_PERCENTUAL } from "../../../lib/financeiro";

export default async function LeadsMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId } });
  if (!motorista) redirect("/entrar");

  const leads = await db.lead.findMany({
    where: { motoristaId: motorista.id },
    include: {
      pai: { include: { user: true } },
      filho: { include: { escola: true } },
      contrato: { include: { cobrancas: { select: { paga: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Solicitações recebidas</h1>
      <p className="mt-1 text-sm text-ink-soft">Acompanhe as famílias que solicitaram seu transporte e responda o quanto antes.</p>

      {leads.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Inbox}
            title="Nenhuma solicitação recebida ainda"
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
              whatsappLiberado: l.contrato?.cobrancas.some((c) => c.paga) ?? false,
              filhoNome: l.filho.nome,
              escolaNome: l.filho.escola.nome,
            }))}
            taxaPercentual={TAXA_MOVA_PERCENTUAL}
            pagadorTaxaPadrao={motorista.pagadorTaxaPadrao}
          />
        </div>
      )}
    </div>
  );
}
