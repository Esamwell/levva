"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
  status: string;
  paiNome: string;
  paiTelefone: string | null;
  filhoNome: string;
  escolaNome: string;
};

const OPCOES = [
  { value: "ENCAMINHADO", label: "Contatei" },
  { value: "EM_NEGOCIACAO", label: "Negociando" },
  { value: "FECHADO", label: "Fechado" },
  { value: "NAO_FECHOU", label: "Não fechou" },
];

const STATUS_COLOR: Record<string, string> = {
  AGUARDANDO: "bg-cream-line text-ink-soft",
  ENCAMINHADO: "bg-amber-soft text-navy",
  EM_NEGOCIACAO: "bg-amber-soft text-navy",
  FECHADO: "bg-sage-soft text-sage",
  NAO_FECHOU: "bg-red-50 text-red-600",
};

export default function LeadsList({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [atualizando, setAtualizando] = useState<string | null>(null);

  async function atualizarStatus(id: string, status: string) {
    setAtualizando(id);
    try {
      await fetch(`/api/motorista/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setAtualizando(null);
    }
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div key={lead.id} className="rounded-2xl border border-cream-line bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-navy">{lead.paiNome}</p>
              <p className="text-xs text-ink-soft">
                {lead.filhoNome} · {lead.escolaNome}
                {lead.paiTelefone ? ` · ${lead.paiTelefone}` : ""}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[lead.status]}`}>
              {lead.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {OPCOES.map((op) => (
              <button
                key={op.value}
                disabled={atualizando === lead.id}
                onClick={() => atualizarStatus(lead.id, op.value)}
                className="rounded-full border border-cream-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy disabled:opacity-50"
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
