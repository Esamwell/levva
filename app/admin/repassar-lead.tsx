"use client";

/**
 * Botão de repasse de lead.
 *
 * Abre a conversa no WhatsApp com o motorista e, no mesmo clique, marca o
 * lead como ENCAMINHADO. Antes era só um link: o lead ficava AGUARDANDO para
 * sempre e o admin perdia a conta de quem já tinha sido repassado — no passo
 * que é o centro do modelo de negócio.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RepassarLead({
  leadId,
  telefoneMotorista,
  mensagem,
}: {
  leadId: string;
  telefoneMotorista: string | null;
  mensagem: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function repassar() {
    setErro(null);
    setEnviando(true);

    // Abre o WhatsApp antes da chamada: se a aba for aberta depois de um
    // await, o navegador trata como popup e bloqueia.
    if (telefoneMotorista) {
      window.open(
        `https://wa.me/${telefoneMotorista}?text=${encodeURIComponent(mensagem)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/repassar`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.error || "Não foi possível marcar como repassado.");
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão ao marcar o repasse.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={repassar}
        disabled={enviando}
        className="rounded-full bg-amber px-3 py-1.5 text-xs font-bold text-navy transition hover:bg-amber/90 disabled:opacity-50"
      >
        {enviando ? "Repassando..." : "Repassar via WhatsApp"}
      </button>
      {!telefoneMotorista && (
        <span className="text-[11px] text-ink-soft">Motorista sem telefone cadastrado</span>
      )}
      {erro && <span className="text-[11px] text-red-600">{erro}</span>}
    </div>
  );
}
