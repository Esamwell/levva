"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";

type Contrato = {
  id: string;
  filhoNome: string;
  escolaNome: string;
  paiNome: string;
  valorCentavos: number;
  liquidoCentavos: number;
  periodicidade: "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
  pagadorTaxa: "MOTORISTA" | "PAI";
  taxaCentavos: number;
  vencimento: string;
  emDia: boolean;
  ultimoRecebimento: string | null;
};

const PERIODO_LABEL: Record<Contrato["periodicidade"], string> = {
  MENSAL: "mês",
  TRIMESTRAL: "trimestre",
  SEMESTRAL: "semestre",
  ANUAL: "ano",
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinanceiroMotoristaList({ contratos }: { contratos: Contrato[] }) {
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);

  async function marcarRecebido(id: string) {
    setProcessando(id);
    try {
      const res = await fetch(`/api/motorista/contratos/${id}/cobrancas`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="mt-8 space-y-3">
      {contratos.map((c) => (
        <div key={c.id} className="rounded-2xl border border-cream-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{c.filhoNome}</p>
              <p className="text-xs text-ink-soft">
                {c.escolaNome} · responsável: {c.paiNome}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                c.emDia
                  ? "border-transparent bg-sage-soft font-semibold text-sage"
                  : "border-transparent bg-amber-soft font-semibold text-navy"
              }
            >
              {c.emDia ? "Em dia" : "Aguardando recebimento"}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-cream-line pt-3 text-xs sm:grid-cols-4">
            <div>
              <p className="text-ink-soft">Valor combinado</p>
              <p className="mt-0.5 font-semibold text-navy">
                {formatarReais(c.valorCentavos)}/{PERIODO_LABEL[c.periodicidade]}
              </p>
            </div>
            <div>
              <p className="text-ink-soft">Você recebe</p>
              <p className="mt-0.5 font-semibold text-sage">{formatarReais(c.liquidoCentavos)}</p>
            </div>
            <div>
              <p className="text-ink-soft">Próximo vencimento</p>
              <p className="mt-0.5 font-semibold text-navy">{new Date(c.vencimento).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-ink-soft">Último recebido</p>
              <p className="mt-0.5 font-semibold text-navy">
                {c.ultimoRecebimento ? new Date(c.ultimoRecebimento).toLocaleDateString("pt-BR") : "Ainda não"}
              </p>
            </div>
          </div>

          <div className="mt-3 border-t border-cream-line pt-3">
            <Button
              size="sm"
              disabled={processando === c.id}
              onClick={() => marcarRecebido(c.id)}
              className="bg-navy text-white hover:bg-navy/90"
            >
              <Check className="h-3.5 w-3.5" />
              {processando === c.id ? "Marcando..." : "Marcar ciclo como recebido"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
