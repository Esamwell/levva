"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { TicketStatusBadge } from "../../../components/ticket-status-badge";
import { LifeBuoy } from "lucide-react";
import { cn } from "../../../lib/utils";

type Ticket = {
  id: string;
  assunto: string;
  status: "ABERTO" | "RESPONDIDO" | "FECHADO";
  updatedAt: string;
  autorNome: string;
  autorRole: "PAI" | "MOTORISTA" | "ADMIN";
};

const PAPEL_LABEL: Record<Ticket["autorRole"], string> = { PAI: "Pai", MOTORISTA: "Motorista", ADMIN: "Admin" };

const FILTROS = [
  { value: "ABERTO", label: "Aguardando resposta" },
  { value: "RESPONDIDO", label: "Respondidos" },
  { value: "FECHADO", label: "Encerrados" },
  { value: "TODOS", label: "Todos" },
] as const;

export default function SuporteList({ tickets }: { tickets: Ticket[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["value"]>("ABERTO");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filtro !== "TODOS" && t.status !== filtro) return false;
      if (!termo) return true;
      return t.assunto.toLowerCase().includes(termo) || t.autorNome.toLowerCase().includes(termo);
    });
  }, [tickets, busca, filtro]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por assunto ou nome"
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
          <EmptyState icon={LifeBuoy} title="Nenhum chamado aqui" description="Muda o filtro ou a busca pra ver outros." />
        ) : (
          filtrados.map((t) => (
            <Link
              key={t.id}
              href={`/admin/suporte/${t.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white p-5 hover:border-amber"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy">{t.assunto}</p>
                <p className="text-xs text-ink-soft">
                  {t.autorNome} · {PAPEL_LABEL[t.autorRole]} · {new Date(t.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <TicketStatusBadge status={t.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
