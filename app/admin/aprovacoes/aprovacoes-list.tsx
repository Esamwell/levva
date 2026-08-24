"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck, FileX, Car } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import SpotlightCard from "../../../components/SpotlightCard";

type Motorista = {
  id: string;
  nome: string;
  telefone: string | null;
  cnhNumero: string;
  cnhCategoria: string;
  cnhDocUrl: string | null;
  cursoDocUrl: string | null;
  antecedentesDocUrl: string | null;
  veiculos: { placa: string; modelo: string }[];
};

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function AprovacoesList({ motoristas }: { motoristas: Motorista[] }) {
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);

  async function aprovar(id: string) {
    setProcessando(id);
    try {
      await fetch(`/api/admin/motoristas/${id}/aprovar`, { method: "POST" });
      router.refresh();
    } finally {
      setProcessando(null);
    }
  }

  async function reprovar(id: string) {
    const motivo = window.prompt("Motivo da reprovação (o motorista vai receber isso):");
    if (!motivo) return;
    setProcessando(id);
    try {
      await fetch(`/api/admin/motoristas/${id}/reprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      });
      router.refresh();
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {motoristas.map((m) => (
        <SpotlightCard
          key={m.id}
          spotlightColor="rgba(79, 109, 92, 0.16)"
          className="rounded-2xl border border-cream-line bg-white p-5"
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-navy text-xs font-bold text-white">{iniciais(m.nome)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg text-navy">{m.nome}</p>
              <p className="text-xs text-ink-soft">
                {m.telefone ?? "sem telefone"} · CNH {m.cnhCategoria} nº {m.cnhNumero}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-ink-soft">
            {m.veiculos.map((v) => (
              <span key={v.placa} className="flex items-center gap-1 rounded-full bg-cream px-2.5 py-1">
                <Car className="h-3 w-3" /> {v.modelo} ({v.placa})
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {[
              { label: "CNH", url: m.cnhDocUrl },
              { label: "Curso de transporte", url: m.cursoDocUrl },
              { label: "Antecedentes", url: m.antecedentesDocUrl },
            ].map((doc) => (
              <a
                key={doc.label}
                href={doc.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className={
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 " +
                  (doc.url
                    ? "border-sage-soft text-sage hover:bg-sage-soft/40"
                    : "pointer-events-none border-cream-line text-ink-soft/50")
                }
              >
                {doc.url ? <FileCheck className="h-3.5 w-3.5" /> : <FileX className="h-3.5 w-3.5" />}
                {doc.url ? doc.label : `${doc.label} não enviado`}
              </a>
            ))}
          </div>

          <div className="mt-4 flex gap-2 border-t border-cream-line pt-4">
            <Button
              size="sm"
              disabled={processando === m.id}
              onClick={() => aprovar(m.id)}
              className="flex-1 bg-sage text-white hover:bg-sage/90"
            >
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={processando === m.id}
              onClick={() => reprovar(m.id)}
              className="flex-1 border-cream-line text-ink-soft hover:bg-cream"
            >
              Reprovar
            </Button>
          </div>
        </SpotlightCard>
      ))}
    </div>
  );
}
