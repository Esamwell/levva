import { exigirPapel } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { redirect } from "next/navigation";
import LeadsList from "./leads-list";

export default async function LeadsMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    include: { assinatura: true },
  });
  if (!motorista) redirect("/entrar");

  const leads = await db.lead.findMany({
    where: { motoristaId: motorista.id },
    include: { pai: { include: { user: true } }, filho: { include: { escola: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-navy">Leads recebidos</h1>
        <span className="rounded-full bg-sage-soft px-3 py-1 text-xs font-semibold text-sage">
          {motorista.assinatura
            ? `Assinatura ${motorista.assinatura.status.toLowerCase()} — Plano ${
                motorista.assinatura.plano === "BASICO" ? "Básico" : "Frota"
              }`
            : "Sem assinatura"}
        </span>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-line bg-white p-10 text-center text-ink-soft">
          Nenhum lead recebido ainda. Assim que um pai solicitar contato, ele aparece aqui.
        </div>
      ) : (
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
      )}
    </div>
  );
}
