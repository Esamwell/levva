"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export type ThreadMensagem = {
  id: string;
  corpo: string;
  createdAt: string;
  mine: boolean;
  isAdmin: boolean;
  label: string;
};

/**
 * Thread de chamado reaproveitada nos três painéis (pai, motorista, admin) —
 * quem pode ver e responder muda por página, mas a UI é a mesma. Enviar
 * mensagem num chamado ENCERRADO reabre automaticamente (ver
 * POST /api/tickets/[id]/mensagens), então o botão só troca de rótulo.
 */
export function TicketThread({
  ticketId,
  mensagens,
  status,
  podeEncerrar,
}: {
  ticketId: string;
  mensagens: ThreadMensagem[];
  status: "ABERTO" | "RESPONDIDO" | "FECHADO";
  podeEncerrar: boolean;
}) {
  const router = useRouter();
  const [corpo, setCorpo] = useState("");
  const [enviando, setEnviando] = useState<"mensagem" | "fechar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!corpo.trim()) return;
    setEnviando("mensagem");
    setErro(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/mensagens`, {
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
      setEnviando(null);
    }
  }

  async function encerrar() {
    setEnviando("fechar");
    setErro(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/fechar`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setErro("Não deu pra encerrar.");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div>
      <div className="space-y-3">
        {mensagens.map((m) => (
          <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5",
                m.mine ? "bg-navy text-white" : m.isAdmin ? "bg-sage-soft text-navy" : "bg-cream text-navy"
              )}
            >
              <p className={cn("text-[11px] font-semibold", m.mine ? "text-white/70" : "text-ink-soft")}>{m.label}</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{m.corpo}</p>
              <p className={cn("mt-1 text-[10px]", m.mine ? "text-white/50" : "text-ink-soft/70")}>
                {new Date(m.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-cream-line pt-4">
        {status === "FECHADO" && (
          <p className="mb-2 text-xs text-ink-soft">Esse chamado está encerrado. Responder reabre automaticamente.</p>
        )}
        <textarea
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          placeholder="Escreva sua mensagem..."
          rows={3}
          className="w-full resize-none rounded-xl border border-cream-line px-3.5 py-2.5 text-sm outline-none focus:border-amber"
        />
        {erro && <p className="mt-1.5 text-xs text-red-600">{erro}</p>}
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            disabled={!!enviando || !corpo.trim()}
            onClick={enviar}
            className="bg-navy text-white hover:bg-navy/90"
          >
            {enviando === "mensagem" ? "Enviando..." : status === "FECHADO" ? "Reabrir e enviar" : "Enviar"}
          </Button>
          {podeEncerrar && status !== "FECHADO" && (
            <Button
              size="sm"
              variant="outline"
              disabled={!!enviando}
              onClick={encerrar}
              className="border-cream-line text-ink-soft hover:bg-cream"
            >
              {enviando === "fechar" ? "Encerrando..." : "Encerrar chamado"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
