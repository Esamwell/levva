"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { cn } from "../../../lib/utils";

type Lead = { id: string; paiNome: string; filhoNome: string };

const PERIODOS = [
  { value: "MENSAL", label: "Mensal" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
] as const;

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FecharContratoDialog({
  lead,
  taxaPercentual,
  pagadorTaxaPadrao,
  onClose,
  onFechado,
}: {
  lead: Lead | null;
  taxaPercentual: number;
  pagadorTaxaPadrao: "MOTORISTA" | "PAI";
  onClose: () => void;
  onFechado: () => void;
}) {
  const [valor, setValor] = useState("");
  const [periodicidade, setPeriodicidade] = useState<(typeof PERIODOS)[number]["value"]>("MENSAL");
  const [pagadorTaxa, setPagadorTaxa] = useState<"MOTORISTA" | "PAI">(pagadorTaxaPadrao);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valorCentavos = Math.round((parseFloat(valor.replace(",", ".")) || 0) * 100);
  const taxaCentavos = Math.round((valorCentavos * taxaPercentual) / 100);
  const valorLiquidoMotorista = pagadorTaxa === "MOTORISTA" ? valorCentavos - taxaCentavos : valorCentavos;
  const valorCobradoPai = pagadorTaxa === "PAI" ? valorCentavos + taxaCentavos : valorCentavos;

  function resetar() {
    setValor("");
    setPeriodicidade("MENSAL");
    setPagadorTaxa(pagadorTaxaPadrao);
    setErro(null);
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!lead || valorCentavos <= 0) {
      setErro("Informe o valor combinado.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/motorista/leads/${lead.id}/fechar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorCentavos, periodicidade, pagadorTaxa }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra fechar.");
      resetar();
      onFechado();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra fechar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog
      open={lead !== null}
      onOpenChange={(v) => {
        if (!v) {
          resetar();
          onClose();
        }
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-sm">
        {lead && (
          <form onSubmit={confirmar} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg font-normal text-navy">
                Fechar com {lead.paiNome}
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-soft">
                Sem mensalidade pra ficar na Mova: só uma taxa de {taxaPercentual}% em cima do valor recorrente combinado.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Valor combinado
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-soft">R$</span>
                <input
                  required
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="450,00"
                  className="w-full rounded-xl border border-cream-line py-2.5 pl-9 pr-4 text-sm outline-none focus:border-amber"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Periodicidade
              </label>
              <div className="flex gap-1.5">
                {PERIODOS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriodicidade(p.value)}
                    className={cn(
                      "flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      periodicidade === p.value
                        ? "border-navy bg-navy text-white"
                        : "border-cream-line text-ink-soft hover:border-amber"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Quem paga a taxa da Mova
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setPagadorTaxa("MOTORISTA")}
                  className={cn(
                    "w-full rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                    pagadorTaxa === "MOTORISTA" ? "border-navy bg-cream" : "border-cream-line hover:border-amber"
                  )}
                >
                  <span className="font-semibold text-navy">Eu absorvo</span>
                  <span className="block text-xs text-ink-soft">Desconta da minha parte</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPagadorTaxa("PAI")}
                  className={cn(
                    "w-full rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                    pagadorTaxa === "PAI" ? "border-navy bg-cream" : "border-cream-line hover:border-amber"
                  )}
                >
                  <span className="font-semibold text-navy">Repasso pro responsável</span>
                  <span className="block text-xs text-ink-soft">Soma no valor cobrado da família</span>
                </button>
              </div>
            </div>

            {valorCentavos > 0 && (
              <div className="rounded-xl bg-cream px-3.5 py-3 text-xs text-ink-soft">
                <p className="flex justify-between">
                  <span>Taxa Mova ({taxaPercentual}%)</span>
                  <span className="font-semibold text-navy">{formatarReais(taxaCentavos)}</span>
                </p>
                <p className="mt-1 flex justify-between">
                  <span>Você recebe</span>
                  <span className="font-semibold text-navy">{formatarReais(valorLiquidoMotorista)}</span>
                </p>
                <p className="mt-1 flex justify-between">
                  <span>Família paga</span>
                  <span className="font-semibold text-navy">{formatarReais(valorCobradoPai)}</span>
                </p>
              </div>
            )}

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  resetar();
                  onClose();
                }}
                className="flex-1 rounded-full border border-cream-line py-2 text-sm font-semibold text-ink-soft"
              >
                Cancelar
              </button>
              <button
                disabled={enviando}
                className="flex-1 rounded-full bg-amber py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {enviando ? "Fechando..." : "Confirmar fechamento"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
