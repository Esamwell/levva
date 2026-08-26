"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

export function NovoChamadoDialog({ voltarPara }: { voltarPara: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assunto, mensagem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não deu pra abrir o chamado.");
      setOpen(false);
      setAssunto("");
      setMensagem("");
      router.push(`${voltarPara}/${data.ticketId}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra abrir o chamado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="bg-navy text-white hover:bg-navy/90">
        <Plus className="h-4 w-4" /> Novo chamado
      </Button>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-sm">
        <form onSubmit={enviar} className="space-y-3">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-navy">Abrir chamado</DialogTitle>
            <DialogDescription className="text-xs text-ink-soft">
              A equipe Mova responde por aqui — sem precisar de WhatsApp ou telefone.
            </DialogDescription>
          </DialogHeader>

          <input
            required
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Assunto (ex.: dúvida sobre pagamento)"
            className="w-full rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <textarea
            required
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Descreva o que está acontecendo"
            rows={4}
            className="w-full resize-none rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber"
          />

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full border border-cream-line py-2 text-sm font-semibold text-ink-soft"
            >
              Cancelar
            </button>
            <button
              disabled={enviando}
              className="flex-1 rounded-full bg-amber py-2 text-sm font-bold text-navy disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Abrir chamado"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
