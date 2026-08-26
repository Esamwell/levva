"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { TERMOS_MOTORISTA, TERMOS_FAMILIAS } from "../lib/termos-conteudo";
import { TERMOS_VERSAO_ATUAL } from "../lib/termos";

const MARGEM_FIM_PX = 24;

export function TermosModal({
  open,
  onOpenChange,
  publico,
  onAceitar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publico: "motorista" | "familias";
  onAceitar: () => void;
}) {
  const clausulas = publico === "motorista" ? TERMOS_MOTORISTA : TERMOS_FAMILIAS;
  const contentRef = useRef<HTMLDivElement>(null);
  const [chegouAoFim, setChegouAoFim] = useState(false);

  function conferirFim() {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= MARGEM_FIM_PX) {
      setChegouAoFim(true);
    }
  }

  // Reabrir zera o progresso — e confere de cara se o texto já cabe sem
  // rolar (tela grande / pouco conteúdo), pra não travar quem não tem
  // scrollbar nenhum pra puxar.
  useEffect(() => {
    if (open) {
      setChegouAoFim(false);
      requestAnimationFrame(conferirFim);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, publico]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[calc(100%-2rem)] max-w-xl flex-col rounded-2xl p-0 sm:h-[600px]">
        <DialogHeader className="border-b border-cream-line px-6 pb-4 pt-6">
          <DialogTitle className="font-serif text-lg font-normal text-navy">
            Termos de Uso {publico === "motorista" ? "— motoristas" : "— famílias"}
          </DialogTitle>
        </DialogHeader>

        <div ref={contentRef} onScroll={conferirFim} className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink-soft">
          {clausulas.map((c) => (
            <p key={c.titulo}>
              <strong className="text-navy">{c.titulo}</strong> {c.texto}
            </p>
          ))}
          <p className="pt-2 text-xs text-ink-soft/70">Versão {TERMOS_VERSAO_ATUAL}. Fim dos termos.</p>
        </div>

        <div className="border-t border-cream-line px-6 py-4">
          {!chegouAoFim && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-ink-soft">
              <ArrowDown className="h-3.5 w-3.5" /> Role até o final pra poder concordar.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full border border-cream-line py-2.5 text-sm font-semibold text-ink-soft"
            >
              Cancelar
            </button>
            <Button
              disabled={!chegouAoFim}
              onClick={onAceitar}
              className="flex-1 gap-1.5 bg-amber text-navy hover:bg-amber/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> Concordo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
