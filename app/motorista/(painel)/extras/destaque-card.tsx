"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DestaqueCard({ ativo, valorCentavos }: { ativo: boolean; valorCentavos: number }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alternar() {
    if (ativo && !window.confirm("Cancelar o destaque? Você sai do topo da busca e perde o selo.")) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/motorista/extras/destaque/${ativo ? "cancelar" : "ativar"}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra atualizar.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra atualizar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-soft/40 text-navy">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        </div>
        {ativo && (
          <Badge variant="outline" className="border-transparent bg-sage-soft font-semibold text-sage">
            Ativo
          </Badge>
        )}
      </div>
      <p className="mt-3 font-serif text-lg text-navy">Destaque</p>
      <p className="mt-1 text-sm text-ink-soft">
        Apareça no topo da busca com selo de destaque — {formatarReais(valorCentavos)}/mês.
      </p>

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      <Button
        size="sm"
        disabled={carregando}
        onClick={alternar}
        className={
          ativo
            ? "mt-4 border border-red-200 bg-white text-red-600 hover:bg-red-50"
            : "mt-4 bg-navy text-white hover:bg-navy/90"
        }
      >
        {carregando ? "Aguarde..." : ativo ? "Cancelar destaque" : "Ativar destaque"}
      </Button>
    </div>
  );
}
