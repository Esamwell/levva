"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export type LeadMensagem = {
  id: string;
  corpo: string;
  createdAt: string;
  mine: boolean;
  label: string;
};

/**
 * Chat entre pai e motorista sobre um lead — reaproveitado nos dois
 * painéis, mesma UI, o que muda é quem está logado. Sem conceito de
 * "encerrar" (ao contrário do TicketThread de suporte): a conversa fica
 * aberta durante e depois do contrato, pra combinar rotina.
 */
export function LeadThread({ leadId, mensagens }: { leadId: string; mensagens: LeadMensagem[] }) {
  const router = useRouter();
  const [corpo, setCorpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!corpo.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corpo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra enviar.");
      setCorpo("");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {mensagens.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">Nenhuma mensagem ainda. Combine os detalhes por aqui.</p>
      ) : (
        <div className="space-y-3">
          {mensagens.map((m) => (
            <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", m.mine ? "bg-navy text-white" : "bg-cream text-navy")}>
                <p className={cn("text-[11px] font-semibold", m.mine ? "text-white/70" : "text-ink-soft")}>{m.label}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">{m.corpo}</p>
                <p className={cn("mt-1 text-[10px]", m.mine ? "text-white/50" : "text-ink-soft/70")}>
                  {new Date(m.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-cream-line pt-4">
        <textarea
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          placeholder="Escreva sua mensagem..."
          rows={3}
          className="w-full resize-none rounded-xl border border-cream-line px-3.5 py-2.5 text-sm outline-none focus:border-amber"
        />
        {erro && <p className="mt-1.5 text-xs text-red-600">{erro}</p>}
        <Button
          size="sm"
          disabled={enviando || !corpo.trim()}
          onClick={enviar}
          className="mt-2 bg-navy text-white hover:bg-navy/90"
        >
          {enviando ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
