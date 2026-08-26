"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";

type Saque = {
  id: string;
  valorCentavos: number;
  status: "PENDENTE" | "PAGO";
  createdAt: string;
  pagoEm: string | null;
  motoristaId: string;
  motoristaNome: string;
};

const FILTROS = [
  { value: "PENDENTE", label: "Pendentes" },
  { value: "PAGO", label: "Pagos" },
  { value: "TODOS", label: "Todos" },
] as const;

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SaquesList({ saques }: { saques: Saque[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["value"]>("PENDENTE");
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const filtrados = useMemo(
    () => (filtro === "TODOS" ? saques : saques.filter((s) => s.status === filtro)),
    [saques, filtro]
  );

  async function marcarPago(id: string) {
    if (!window.confirm("Já fez o Pix pro motorista? Isso marca o saque como pago e avisa ele por e-mail.")) return;
    setErro(null);
    setProcessando(id);
    try {
      const res = await fetch(`/api/admin/saques/${id}/marcar-pago`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra marcar.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra marcar.");
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="mt-6">
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

      {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

      <div className="mt-4 space-y-2.5">
        {filtrados.length === 0 ? (
          <EmptyState icon={Wallet} title="Nenhum saque aqui" description="Muda o filtro pra ver outros." />
        ) : (
          filtrados.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white p-5">
              <div className="text-sm">
                <Link href={`/admin/motoristas/${s.motoristaId}`} className="font-semibold text-navy hover:underline">
                  {s.motoristaNome}
                </Link>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Pedido em {new Date(s.createdAt).toLocaleString("pt-BR")}
                  {s.pagoEm && ` · pago em ${new Date(s.pagoEm).toLocaleString("pt-BR")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-serif text-lg text-navy">{formatarReais(s.valorCentavos)}</span>
                {s.status === "PAGO" ? (
                  <Badge variant="outline" className="border-transparent bg-sage-soft font-semibold text-sage">
                    Pago
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    disabled={processando === s.id}
                    onClick={() => marcarPago(s.id)}
                    className="bg-navy text-white hover:bg-navy/90"
                  >
                    {processando === s.id ? "Marcando..." : "Marcar como pago"}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
