"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
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
  temAssinatura: boolean;
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
            {c.temAssinatura ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-sage">
                <CheckCircle2 className="h-3.5 w-3.5" /> Cobrança automática ativa. A Mova cobra {c.paiNome} a cada
                ciclo, sem você precisar fazer nada.
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Cobrança automática ainda não configurada. Avise o suporte
                da Mova.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
