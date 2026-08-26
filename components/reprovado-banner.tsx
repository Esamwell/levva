"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

export function ReprovadoBanner({ motivo, elegivelEmISO }: { motivo: string; elegivelEmISO: string | null }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const elegivelEm = elegivelEmISO ? new Date(elegivelEmISO) : null;
  const podeSolicitar = !elegivelEm || elegivelEm <= new Date();

  async function solicitar() {
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/motorista/solicitar-reanalise", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível solicitar.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível solicitar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-600">Seu cadastro foi reprovado</p>
          <p className="mt-1 text-sm text-red-600/90">{motivo}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {podeSolicitar ? (
              <Button size="sm" disabled={enviando} onClick={solicitar} className="bg-navy text-white hover:bg-navy/90">
                {enviando ? "Enviando..." : "Solicitar nova análise"}
              </Button>
            ) : (
              <p className="text-xs text-red-600/80">
                Você pode solicitar uma nova análise a partir de {elegivelEm!.toLocaleDateString("pt-BR")}.
              </p>
            )}
          </div>
          {erro && <p className="mt-2 text-xs text-red-700">{erro}</p>}
        </div>
      </div>
    </div>
  );
}
