"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Star, Trash2, Check } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/empty-state";
import { cn } from "../../../lib/utils";

type Avaliacao = {
  id: string;
  nota: number;
  comentario: string | null;
  moderado: boolean;
  createdAt: string;
  motoristaId: string;
  motoristaNome: string;
  paiId: string;
  paiNome: string;
};

const FILTROS = [
  { value: "PENDENTE", label: "Pendentes" },
  { value: "PUBLICADO", label: "Publicados" },
  { value: "TODOS", label: "Todos" },
] as const;

export default function DepoimentosList({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["value"]>("PENDENTE");
  const [processando, setProcessando] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return avaliacoes.filter((a) => {
      if (filtro === "PENDENTE" && a.moderado) return false;
      if (filtro === "PUBLICADO" && !a.moderado) return false;
      if (!termo) return true;
      return a.motoristaNome.toLowerCase().includes(termo) || a.paiNome.toLowerCase().includes(termo);
    });
  }, [avaliacoes, busca, filtro]);

  async function aprovar(id: string) {
    setProcessando(id);
    try {
      const res = await fetch(`/api/admin/depoimentos/${id}/aprovar`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setProcessando(null);
    }
  }

  async function excluir(id: string) {
    if (!window.confirm("Excluir esse depoimento? Não tem como desfazer.")) return;
    setProcessando(id);
    try {
      const res = await fetch(`/api/admin/depoimentos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setProcessando(null);
    }
  }

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

      <div className="mt-4 space-y-3">
        {filtrados.length === 0 ? (
          <EmptyState icon={Star} title="Nenhum depoimento aqui" description="Muda o filtro ou a busca pra ver outros." />
        ) : (
          filtrados.map((a) => (
            <div key={a.id} className="rounded-2xl border border-cream-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1 text-amber">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-3.5 w-3.5", i < a.nota ? "fill-amber" : "text-cream-line")} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-sm">
                    <Link href={`/admin/pais/${a.paiId}`} className="font-semibold text-navy hover:underline">
                      {a.paiNome}
                    </Link>{" "}
                    <span className="text-ink-soft">avaliou</span>{" "}
                    <Link href={`/admin/motoristas/${a.motoristaId}`} className="font-semibold text-sage hover:underline">
                      {a.motoristaNome}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">{new Date(a.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    a.moderado
                      ? "border-transparent bg-sage-soft font-semibold text-sage"
                      : "border-transparent bg-amber-soft font-semibold text-navy"
                  }
                >
                  {a.moderado ? "Publicado" : "Pendente"}
                </Badge>
              </div>

              {a.comentario && <p className="mt-3 text-sm text-ink-soft">"{a.comentario}"</p>}

              <div className="mt-4 flex gap-2 border-t border-cream-line pt-4">
                {!a.moderado && (
                  <Button
                    size="sm"
                    disabled={processando === a.id}
                    onClick={() => aprovar(a.id)}
                    className="flex-1 bg-sage text-white hover:bg-sage/90"
                  >
                    <Check className="h-3.5 w-3.5" /> Aprovar e publicar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={processando === a.id}
                  onClick={() => excluir(a.id)}
                  className={cn("border-red-200 text-red-600 hover:bg-red-50", a.moderado ? "flex-1" : "")}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
