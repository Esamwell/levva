"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";

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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
