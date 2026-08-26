"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";

type Motorista = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  statusAprovacao: "PENDENTE" | "APROVADO" | "REPROVADO";
  plano: "BASICO" | "FROTA" | null;
  statusAssinatura: string | null;
  createdAt: string;
};

const APROVACAO_META: Record<Motorista["statusAprovacao"], { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-amber-soft text-navy" },
  APROVADO: { label: "Aprovado", className: "bg-sage-soft text-sage" },
  REPROVADO: { label: "Reprovado", className: "bg-red-50 text-red-600" },
};

const FILTROS = [
  { value: "TODOS", label: "Todos" },
  { value: "PENDENTE", label: "Pendentes" },
  { value: "APROVADO", label: "Aprovados" },
  { value: "REPROVADO", label: "Reprovados" },
] as const;

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default function MotoristasList({ motoristas }: { motoristas: Motorista[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["value"]>("TODOS");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return motoristas.filter((m) => {
      if (filtro !== "TODOS" && m.statusAprovacao !== filtro) return false;
      if (!termo) return true;
      return m.nome.toLowerCase().includes(termo) || m.email.toLowerCase().includes(termo);
    });
  }, [motoristas, busca, filtro]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
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

      <div className="mt-4 space-y-2">
        {filtrados.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-cream-line bg-white p-8 text-center text-sm text-ink-soft">
            Nenhum motorista encontrado.
          </p>
        ) : (
          filtrados.map((m) => (
            <Link
              key={m.id}
              href={`/admin/motoristas/${m.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white px-4 py-3.5 transition hover:border-amber"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-navy text-xs font-bold text-white">
                    {iniciais(m.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">
                    {m.nome}
                    {!m.ativo && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                        Desativado
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {m.email}
                    {m.plano && ` · ${m.plano === "BASICO" ? "Básico" : "Frota"}`}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant="outline" className={cn("border-transparent font-semibold", APROVACAO_META[m.statusAprovacao].className)}>
                  {APROVACAO_META[m.statusAprovacao].label}
                </Badge>
                <ChevronRight className="h-4 w-4 text-ink-soft" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
