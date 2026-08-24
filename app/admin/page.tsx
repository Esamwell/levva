import { db } from "../../lib/db";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminDashboardPage() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [assinaturasAtivas, transportadoresAtivos, leadsEsteMes, leadsFechados, totalLeads] =
    await Promise.all([
      db.assinatura.findMany({ where: { status: "ATIVA" }, select: { valorCentavos: true } }),
      db.motorista.count({ where: { statusAprovacao: "APROVADO" } }),
      db.lead.count({ where: { createdAt: { gte: inicioMes } } }),
      db.lead.count({ where: { status: "FECHADO" } }),
      db.lead.count(),
    ]);

  const mrrCentavos = assinaturasAtivas.reduce((soma, a) => soma + a.valorCentavos, 0);
  const taxaConversao = totalLeads > 0 ? (leadsFechados / totalLeads) * 100 : 0;

  const metrics = [
    { label: "MRR atual", value: formatarReais(mrrCentavos) },
    { label: "Transportadores ativos", value: String(transportadoresAtivos) },
    { label: "Leads este mês", value: String(leadsEsteMes) },
    { label: "Taxa de conversão", value: `${taxaConversao.toFixed(0)}%` },
  ];

  const leadsPendentes = await db.lead.findMany({
    where: { status: "AGUARDANDO" },
    include: {
      pai: { include: { user: true } },
      motorista: { include: { user: true } },
      filho: { include: { escola: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-mono text-2xl">{m.value}</div>
            <div className="mt-1 text-xs text-white/60">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-xl">Leads aguardando repasse manual</h2>
        {leadsPendentes.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Nenhum lead aguardando no momento.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {leadsPendentes.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span>
                  {lead.pai.user.nome} → {lead.motorista.user.nome}{" "}
                  <span className="text-white/50">
                    ({lead.filho.nome}, {lead.filho.escola.nome})
                  </span>
                </span>
                <a
                  href={`https://wa.me/${lead.motorista.user.telefone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy"
                >
                  Repassar via WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
