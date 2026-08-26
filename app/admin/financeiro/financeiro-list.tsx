"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileText, ExternalLink, CircleDollarSign } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";

type Cobranca = {
  id: string;
  competencia: string;
  valorCentavos: number;
  paga: boolean;
  asaasPaymentId: string | null;
  linkPagamento: string | null;
};

type Contrato = {
  id: string;
  valorCentavos: number;
  periodicidade: "MENSAL" | "TRIMESTRAL" | "ANUAL";
  pagadorTaxa: "MOTORISTA" | "PAI";
  taxaCentavos: number;
  taxaPercentual: number;
  createdAt: string;
  motoristaId: string;
  motoristaNome: string;
  paiId: string;
  paiNome: string;
  paiTemCpfCnpj: boolean;
  cobrancas: Cobranca[];
};

const PERIODO_LABEL: Record<Contrato["periodicidade"], string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  ANUAL: "Anual",
};

const FILTROS = [
  { value: "TODOS", label: "Todos" },
  { value: "MENSAL", label: "Mensal" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "ANUAL", label: "Anual" },
] as const;

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CobrancasContrato({ contrato }: { contrato: Contrato }) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const pendente = contrato.cobrancas.find((cb) => !cb.paga && cb.asaasPaymentId);

  async function gerarCobranca() {
    setErro(null);
    setGerando(true);
    try {
      const res = await fetch(`/api/admin/contratos/${contrato.id}/gerar-cobranca`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra gerar a cobrança.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra gerar a cobrança.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="mt-3 border-t border-cream-line pt-3">
      {contrato.cobrancas.length > 0 && (
        <ul className="space-y-1.5">
          {contrato.cobrancas.map((cb) => (
            <li key={cb.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-ink-soft">
                {new Date(cb.competencia).toLocaleDateString("pt-BR")} · {formatarReais(cb.valorCentavos)}
              </span>
              <div className="flex items-center gap-2">
                {cb.paga ? (
                  <Badge variant="outline" className="border-transparent bg-sage-soft text-[10px] font-semibold text-sage">
                    Paga
                  </Badge>
                ) : cb.asaasPaymentId ? (
                  <Badge variant="outline" className="border-transparent bg-amber-soft text-[10px] font-semibold text-navy">
                    Aguardando pagamento
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-transparent bg-cream text-[10px] font-semibold text-ink-soft">
                    Marcada manualmente
                  </Badge>
                )}
                {cb.linkPagamento && (
                  <a
                    href={cb.linkPagamento}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-semibold text-navy hover:underline"
                  >
                    Ver cobrança <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {pendente ? (
          <p className="text-xs text-ink-soft">Já tem uma cobrança aguardando pagamento pra esse ciclo.</p>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={gerando}
            onClick={gerarCobranca}
            className="h-7 gap-1.5 rounded-full border-cream-line text-xs text-navy hover:bg-cream"
          >
            <CircleDollarSign className="h-3.5 w-3.5" />
            {gerando ? "Gerando..." : "Gerar cobrança Asaas"}
          </Button>
        )}
        {!contrato.paiTemCpfCnpj && (
          <Link href={`/admin/pais/${contrato.paiId}`} className="text-xs text-ink-soft hover:text-navy hover:underline">
            Falta o CPF/CNPJ do responsável →
          </Link>
        )}
      </div>
      {erro && <p className="mt-1.5 text-xs text-red-600">{erro}</p>}
    </div>
  );
}

export default function FinanceiroList({ contratos }: { contratos: Contrato[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["value"]>("TODOS");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return contratos.filter((c) => {
      if (filtro !== "TODOS" && c.periodicidade !== filtro) return false;
      if (!termo) return true;
      return c.motoristaNome.toLowerCase().includes(termo) || c.paiNome.toLowerCase().includes(termo);
    });
  }, [contratos, busca, filtro]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por motorista ou pai"
            className="w-full rounded-full border border-cream-line py-2 pl-9 pr-4 text-sm outline-none focus:border-amber"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                filtro === f.value
                  ? "border-navy bg-navy text-white"
                  : "border-cream-line text-ink-soft hover:border-amber hover:text-navy"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {filtrados.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum contrato aqui" description="Muda o filtro ou a busca pra ver outros." />
        ) : (
          filtrados.map((c) => (
            <div key={c.id} className="rounded-2xl border border-cream-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <Link href={`/admin/motoristas/${c.motoristaId}`} className="font-semibold text-navy hover:underline">
                    {c.motoristaNome}
                  </Link>{" "}
                  <span className="text-ink-soft">com</span>{" "}
                  <Link href={`/admin/pais/${c.paiId}`} className="font-semibold text-sage hover:underline">
                    {c.paiNome}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-soft">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge variant="outline" className="border-transparent bg-cream font-semibold text-navy">
                  {PERIODO_LABEL[c.periodicidade]}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-cream-line pt-3 text-xs">
                <div>
                  <p className="text-ink-soft">Valor combinado</p>
                  <p className="mt-0.5 font-semibold text-navy">{formatarReais(c.valorCentavos)}</p>
                </div>
                <div>
                  <p className="text-ink-soft">Taxa Mova ({c.taxaPercentual}%)</p>
                  <p className="mt-0.5 font-semibold text-sage">{formatarReais(c.taxaCentavos)}</p>
                </div>
                <div>
                  <p className="text-ink-soft">Quem paga a taxa</p>
                  <p className="mt-0.5 font-semibold text-navy">{c.pagadorTaxa === "MOTORISTA" ? "Motorista" : "Família"}</p>
                </div>
              </div>

              <CobrancasContrato contrato={c} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
