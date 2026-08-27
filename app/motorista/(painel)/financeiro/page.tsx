import { redirect } from "next/navigation";
import { Wallet, TrendingUp, Clock } from "lucide-react";
import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { TAXA_MOVA_PERCENTUAL, proximoVencimento } from "../../../../lib/financeiro";
import { saldoDisponivelMotorista } from "../../../../lib/saques";
import { StatCard } from "../../../../components/stat-card";
import { EmptyState } from "../../../../components/empty-state";
import FinanceiroMotoristaList from "./financeiro-motorista-list";
import SaqueSection from "./saque-section";

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
      // Só cobranças efetivamente pagas contam pro "último recebimento" e
      // pro cálculo do próximo vencimento — uma cobrança Asaas gerada mas
      // ainda não paga (ver lib/asaas.ts) não pode fingir que o ciclo já
      // foi recebido.
      cobrancas: { where: { paga: true }, orderBy: { competencia: "desc" }, take: 1 },
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
      temAssinatura: !!c.asaasSubscriptionId,
    };
  });

  const receitaLiquidaPorCiclo = linhas.reduce((s, l) => s + l.liquidoCentavos, 0);
  const aguardando = linhas.filter((l) => !l.emDia).length;

  const [saldoCentavos, saques] = await Promise.all([
    saldoDisponivelMotorista(motorista.id),
    db.solicitacaoSaque.findMany({ where: { motoristaId: motorista.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Financeiro</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Contratos ativos e valores a receber em cada ciclo, já com a taxa Mova de {TAXA_MOVA_PERCENTUAL}%
        descontada quando você opta por absorvê-la.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Contratos ativos" value={String(linhas.length)} />
        <StatCard icon={TrendingUp} label="Você recebe por ciclo" value={formatarReais(receitaLiquidaPorCiclo)} />
        <StatCard icon={Clock} label="Aguardando recebimento" value={String(aguardando)} />
      </div>

      <div className="mt-6">
        <SaqueSection
          saldoCentavos={saldoCentavos}
          saques={saques.map((s) => ({
            id: s.id,
            valorCentavos: s.valorCentavos,
            status: s.status,
            createdAt: s.createdAt.toISOString(),
            pagoEm: s.pagoEm?.toISOString() ?? null,
          }))}
        />
      </div>

      {linhas.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Wallet}
            title="Nenhum contrato fechado ainda"
            description="Assim que você fechar uma solicitação, ela aparece aqui."
          />
        </div>
      ) : (
        <FinanceiroMotoristaList contratos={linhas} />
      )}
    </div>
  );
}
