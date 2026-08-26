"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

/**
 * Substitui o window.prompt() nativo (feio, sem estilo, quebra a identidade
 * visual) por um modal no mesmo padrão usado no resto do admin.
 */
export function ReprovarDialog({
  open,
  onOpenChange,
  onConfirmar,
  carregando,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (motivo: string) => void;
  carregando: boolean;
}) {
  const [motivo, setMotivo] = useState("");

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    const valor = motivo.trim();
    if (!valor) return;
    onConfirmar(valor);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setMotivo("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-sm">
        <form onSubmit={confirmar} className="space-y-3">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-navy">
              Motivo da reprovação
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-soft">
              O motorista vai receber esse texto por e-mail.
            </DialogDescription>
          </DialogHeader>

          <textarea
            required
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: documento da CNH ilegível, envie uma foto mais nítida."
            rows={4}
            className="w-full resize-none rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber"
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full border border-cream-line py-2 text-sm font-semibold text-ink-soft"
            >
              Cancelar
            </button>
            <Button
              disabled={carregando || !motivo.trim()}
              className="flex-1 rounded-full bg-amber py-2 text-sm font-bold text-navy hover:bg-amber/90 disabled:opacity-50"
            >
              {carregando ? "Enviando..." : "Reprovar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
