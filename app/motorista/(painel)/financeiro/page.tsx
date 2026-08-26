import { redirect } from "next/navigation";
import { Wallet, TrendingUp, Clock } from "lucide-react";
import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { TAXA_MOVA_PERCENTUAL, proximoVencimento } from "../../../../lib/financeiro";
import { StatCard } from "../../../../components/stat-card";
import { EmptyState } from "../../../../components/empty-state";
import FinanceiroMotoristaList from "./financeiro-motorista-list";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FinanceiroMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) redirect("/entrar");

  const contratos = await db.contrato.findMany({
    where: { motoristaId: motorista.id },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { include: { filho: { include: { escola: true } } } },
      pai: { include: { user: { select: { nome: true } } } },
      cobrancas: { orderBy: { competencia: "desc" }, take: 1 },
    },
  });

  const hoje = new Date();

  const linhas = contratos.map((c) => {
    const liquido = c.pagadorTaxa === "MOTORISTA" ? c.valorCentavos - c.taxaCentavos : c.valorCentavos;
    const vencimento = proximoVencimento(c.periodicidade, c.cobrancas[0]?.competencia ?? c.createdAt);
    const emDia = vencimento > hoje;
    return {
      id: c.id,
      filhoNome: c.lead.filho.nome,
      escolaNome: c.lead.filho.escola.nome,
      paiNome: c.pai.user.nome,
      valorCentavos: c.valorCentavos,
      liquidoCentavos: liquido,
      periodicidade: c.periodicidade,
      pagadorTaxa: c.pagadorTaxa,
      taxaCentavos: c.taxaCentavos,
      vencimento: vencimento.toISOString(),
      emDia,
      ultimoRecebimento: c.cobrancas[0]?.competencia.toISOString() ?? null,
    };
  });

  const receitaLiquidaPorCiclo = linhas.reduce((s, l) => s + l.liquidoCentavos, 0);
  const aguardando = linhas.filter((l) => !l.emDia).length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Financeiro</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Seus contratos ativos e o que você recebe em cada um — taxa Mova de {TAXA_MOVA_PERCENTUAL}% já descontada
        quando é você quem absorve.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Contratos ativos" value={String(linhas.length)} />
        <StatCard icon={TrendingUp} label="Você recebe por ciclo" value={formatarReais(receitaLiquidaPorCiclo)} />
        <StatCard icon={Clock} label="Aguardando recebimento" value={String(aguardando)} />
      </div>

      {linhas.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Wallet}
            title="Nenhum contrato fechado ainda"
            description="Assim que você marcar um lead como fechado, ele aparece aqui."
          />
        </div>
      ) : (
        <FinanceiroMotoristaList contratos={linhas} />
      )}
    </div>
  );
}
