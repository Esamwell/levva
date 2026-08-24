import { redirect } from "next/navigation";
import { Wallet, Car, Users, TrendingUp, ArrowRight } from "lucide-react";
import { db } from "../../lib/db";
import { exigirPapel } from "../../lib/auth";
import RepassarLead from "./repassar-lead";
import { StatCard } from "../../components/stat-card";
import { EmptyState } from "../../components/empty-state";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function AdminDashboardPage() {
  // O middleware já barrou quem não é admin, mas ele só lê o JWT. Confirmar
  // contra o banco aqui é o que pega sessão revogada e papel alterado.
  if (!(await exigirPapel("ADMIN"))) redirect("/entrar");

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
    {
      icon: Wallet,
      label: "MRR atual",
      value: formatarReais(mrrCentavos),
      countTo: Math.round(mrrCentavos / 100),
      prefix: "R$ ",
      separator: ".",
    },
    {
      icon: Car,
      label: "Transportadores ativos",
      value: String(transportadoresAtivos),
      countTo: transportadoresAtivos,
    },
    { icon: Users, label: "Leads este mês", value: String(leadsEsteMes), countTo: leadsEsteMes },
    {
      icon: TrendingUp,
      label: "Taxa de conversão",
      value: `${taxaConversao.toFixed(0)}%`,
      countTo: Math.round(taxaConversao),
      suffix: "%",
    },
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
      <h1 className="font-serif text-3xl text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">Visão geral da operação da Levva.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <StatCard
            key={m.label}
            icon={m.icon}
            label={m.label}
            value={m.value}
            countTo={m.countTo}
            prefix={m.prefix}
            suffix={m.suffix}
            separator={m.separator}
          />
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-navy">Leads aguardando repasse manual</h2>
          <a href="/admin/aprovacoes" className="flex items-center gap-1 text-xs font-semibold text-sage hover:underline">
            Ver aprovações pendentes <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {leadsPendentes.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum lead aguardando"
            description="Assim que uma família solicitar contato com um transportador, ele aparece aqui pra repasse."
          />
        ) : (
          <div className="space-y-2">
            {leadsPendentes.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white px-4 py-3.5"
              >
                <div className="flex items-center gap-3 text-sm">
                  <Avatar className="h-9 w-9 bg-sage-soft">
                    <AvatarFallback className="bg-sage-soft text-xs font-bold text-sage">
                      {iniciais(lead.pai.user.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-navy">
                      {lead.pai.user.nome} <span className="font-normal text-ink-soft">→</span>{" "}
                      {lead.motorista.user.nome}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {lead.filho.nome}, {lead.filho.escola.nome}
                    </p>
                  </div>
                </div>
                <RepassarLead
                  leadId={lead.id}
                  telefoneMotorista={lead.motorista.user.telefone}
                  mensagem={
                    `Olá, ${lead.motorista.user.nome}! Você recebeu um lead na Levva: ` +
                    `${lead.pai.user.nome}, responsável por ${lead.filho.nome} ` +
                    `(${lead.filho.escola.nome}). Contato: ${lead.pai.user.telefone ?? "ver painel"}.`
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
