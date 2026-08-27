import { redirect } from "next/navigation";
import { Wallet, TrendingUp, FileText, Sparkles } from "lucide-react";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import { StatCard } from "../../../components/stat-card";
import { TAXA_MOVA_PERCENTUAL } from "../../../lib/financeiro";
import FinanceiroList from "./financeiro-list";
import ExtrasPendentesList from "./extras-pendentes-list";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FinanceiroPage() {
  const session = await exigirPapel("ADMIN");
  if (!session) redirect("/entrar");

  const [contratos, extrasAtivos, extrasPendentes] = await Promise.all([
    db.contrato.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        motorista: { select: { id: true, user: { select: { nome: true } } } },
        pai: { select: { id: true, user: { select: { nome: true } }, cpfCnpj: true } },
        cobrancas: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.motoristaExtra.findMany({ where: { status: "ATIVO" } }),
    db.motoristaExtra.findMany({
      where: { status: "PENDENTE" },
      orderBy: { createdAt: "asc" },
      include: { motorista: { select: { id: true, user: { select: { nome: true } } } } },
    }),
  ]);

  const receitaTotal = contratos.reduce((s, c) => s + c.taxaCentavos, 0);
  const volumeTotal = contratos.reduce((s, c) => s + c.valorCentavos, 0);
  const receitaExtrasMensal = extrasAtivos
    .filter((e) => e.periodicidade === "MENSAL")
    .reduce((s, e) => s + e.valorCentavos, 0);

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Financeiro</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Modelo em avaliação: sem mensalidade pra ficar listado, só uma taxa de {TAXA_MOVA_PERCENTUAL}% sobre o valor
        recorrente de cada contrato fechado, mais os extras que o motorista contratar avulso. A Mova cobra o pai via
        Asaas (Pix, boleto ou cartão) e repassa a parte do motorista por fora, manualmente.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Receita da Mova (taxas)" value={formatarReais(receitaTotal)} />
        <StatCard icon={TrendingUp} label="Volume transacionado" value={formatarReais(volumeTotal)} />
        <StatCard icon={FileText} label="Contratos fechados" value={String(contratos.length)} />
        <StatCard
          icon={Sparkles}
          label="Extras ativos (destaque etc.)"
          value={String(extrasAtivos.length)}
          hint={receitaExtrasMensal > 0 ? `${formatarReais(receitaExtrasMensal)}/mês em extras mensais` : undefined}
        />
      </div>

      {extrasPendentes.length > 0 && (
        <ExtrasPendentesList
          extras={extrasPendentes.map((e) => ({
            id: e.id,
            tipo: e.tipo,
            valorCentavos: e.valorCentavos,
            periodicidade: e.periodicidade,
            createdAt: e.createdAt.toISOString(),
            motoristaId: e.motorista.id,
            motoristaNome: e.motorista.user.nome,
          }))}
        />
      )}

      <FinanceiroList
        contratos={contratos.map((c) => ({
          id: c.id,
          valorCentavos: c.valorCentavos,
          periodicidade: c.periodicidade,
          pagadorTaxa: c.pagadorTaxa,
          taxaCentavos: c.taxaCentavos,
          taxaPercentual: c.taxaPercentual,
          createdAt: c.createdAt.toISOString(),
          motoristaId: c.motorista.id,
          motoristaNome: c.motorista.user.nome,
          paiId: c.pai.id,
          paiNome: c.pai.user.nome,
          paiTemCpfCnpj: !!c.pai.cpfCnpj,
          temAssinatura: !!c.asaasSubscriptionId,
          cobrancas: c.cobrancas.map((cb) => ({
            id: cb.id,
            competencia: cb.competencia.toISOString(),
            valorCentavos: cb.valorCentavos,
            paga: cb.paga,
            asaasPaymentId: cb.asaasPaymentId,
            linkPagamento: cb.linkPagamento,
          })),
        }))}
      />
    </div>
  );
}
