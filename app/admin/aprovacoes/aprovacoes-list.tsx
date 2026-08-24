"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="mt-8 space-y-4">
      {motoristas.map((m) => (
        <div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-serif text-lg">{m.nome}</p>
              <p className="text-xs text-white/60">
                {m.telefone ?? "sem telefone"} · CNH {m.cnhCategoria} nº {m.cnhNumero}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {m.veiculos.map((v) => `${v.modelo} (${v.placa})`).join(", ")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={processando === m.id}
                onClick={() => aprovar(m.id)}
                className="rounded-full bg-sage px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                disabled={processando === m.id}
                onClick={() => reprovar(m.id)}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/80 disabled:opacity-50"
              >
                Reprovar
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
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
                  "rounded-full border px-3 py-1.5 " +
                  (doc.url
                    ? "border-amber-soft text-amber-soft hover:bg-amber-soft/10"
                    : "border-white/10 text-white/30 pointer-events-none")
                }
              >
                {doc.url ? `Ver ${doc.label}` : `${doc.label} não enviado`}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
