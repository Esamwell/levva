"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export type LeadMensagem = {
  id: string;
  corpo: string;
  createdAt: string;
  mine: boolean;
  label: string;
  // Só preenchido na mensagem automática de cobrança gerada — cartão
  // especial em vez de balão de texto, com o status sempre atual (a
  // página busca a Cobranca de novo a cada render, então não desatualiza
  // depois que o pai paga).
  cobranca?: { id: string; valorFormatado: string; vencimentoFormatado: string; paga: boolean } | null;
};

function CartaoCobranca({ cobranca }: { cobranca: NonNullable<LeadMensagem["cobranca"]> }) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xs rounded-2xl border border-amber bg-amber-soft/20 p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-navy">
          <Wallet className="h-3.5 w-3.5" /> Cobrança gerada
        </div>
        <p className="mt-1 font-serif text-xl text-navy">{cobranca.valorFormatado}</p>
        <p className="text-xs text-ink-soft">Vencimento em {cobranca.vencimentoFormatado}</p>
        {cobranca.paga ? (
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-sage">
            <CheckCircle2 className="h-3.5 w-3.5" /> Pago
          </p>
        ) : (
          <a
            href={`/pagar/${cobranca.id}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-block rounded-full bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy/90"
          >
            Pagar agora
          </a>
        )}
      </div>
    </div>
  );
}

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
          {mensagens.map((m) =>
            m.cobranca ? (
              <CartaoCobranca key={m.id} cobranca={m.cobranca} />
            ) : (
              <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", m.mine ? "bg-navy text-white" : "bg-cream text-navy")}>
                  <p className={cn("text-[11px] font-semibold", m.mine ? "text-white/70" : "text-ink-soft")}>{m.label}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">{m.corpo}</p>
                  <p className={cn("mt-1 text-[10px]", m.mine ? "text-white/50" : "text-ink-soft/70")}>
                    {new Date(m.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            )
          )}
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
