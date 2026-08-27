"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { StatusBadge } from "../../../components/status-badge";
import { FecharContratoDialog } from "./fechar-contrato-dialog";
import { mascararTelefone } from "../../../lib/texto";

type Lead = {
  id: string;
  status: string;
  paiNome: string;
  paiTelefone: string | null;
  whatsappLiberado: boolean;
  filhoNome: string;
  escolaNome: string;
};

const OPCOES = [
  { value: "ENCAMINHADO", label: "Contatei" },
  { value: "EM_NEGOCIACAO", label: "Negociando" },
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

export default function LeadsList({
  leads,
  taxaPercentual,
  pagadorTaxaPadrao,
}: {
  leads: Lead[];
  taxaPercentual: number;
  pagadorTaxaPadrao: "MOTORISTA" | "PAI";
}) {
  const router = useRouter();
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [fecharAlvo, setFecharAlvo] = useState<Lead | null>(null);

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
                  {lead.paiTelefone &&
                    ` · ${lead.whatsappLiberado ? lead.paiTelefone : mascararTelefone(lead.paiTelefone)}`}
                </p>
                {lead.paiTelefone && !lead.whatsappLiberado && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-soft/70">
                    <Lock className="h-3 w-3" /> WhatsApp libera após o pagamento da primeira fatura
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={lead.status} />
              <Link
                href={`/motorista/leads/${lead.id}`}
                className="flex items-center gap-1 rounded-full border border-cream-line px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Conversar
              </Link>
            </div>
          </div>
          {lead.status !== "FECHADO" && (
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
              <Button
                size="sm"
                disabled={atualizando === lead.id}
                onClick={() => setFecharAlvo(lead)}
                className="rounded-full bg-sage text-xs font-semibold text-white hover:bg-sage/90"
              >
                Fechado
              </Button>
            </div>
          )}
        </div>
      ))}

      <FecharContratoDialog
        lead={fecharAlvo}
        taxaPercentual={taxaPercentual}
        pagadorTaxaPadrao={pagadorTaxaPadrao}
        onClose={() => setFecharAlvo(null)}
        onFechado={() => {
          setFecharAlvo(null);
          router.refresh();
        }}
      />
    </div>
  );
}
