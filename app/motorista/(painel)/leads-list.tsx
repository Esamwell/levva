"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { StatusBadge } from "../../../components/status-badge";

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

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

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
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-cream text-xs font-bold text-navy">
                  {iniciais(lead.paiNome)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-navy">{lead.paiNome}</p>
                <p className="text-xs text-ink-soft">
                  {lead.filhoNome} · {lead.escolaNome}
                  {lead.paiTelefone ? ` · ${lead.paiTelefone}` : ""}
                </p>
              </div>
            </div>
            <StatusBadge status={lead.status} />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2 border-t border-cream-line pt-3.5">
            {OPCOES.map((op) => (
              <Button
                key={op.value}
                size="sm"
                variant="outline"
                disabled={atualizando === lead.id}
                onClick={() => atualizarStatus(lead.id, op.value)}
                className="rounded-full border-cream-line text-xs font-semibold text-ink-soft hover:border-amber hover:bg-amber-soft/20 hover:text-navy"
              >
                {op.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
