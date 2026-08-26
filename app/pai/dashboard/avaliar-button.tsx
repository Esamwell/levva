"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Check } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";

export default function AvaliarButton({
  leadId,
  motoristaNome,
  avaliacaoExistente,
}: {
  leadId: string;
  motoristaNome: string;
  avaliacaoExistente: { id: string; nota: number } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (avaliacaoExistente) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-sage">
        <Check className="h-3.5 w-3.5" /> Avaliado
      </span>
    );
  }

  async function enviar() {
    if (nota === 0) {
      setErro("Escolha uma nota de 1 a 5.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/pai/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, nota, comentario: comentario.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não deu pra enviar.");
      setEnviado(true);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setNota(0);
          setComentario("");
          setErro(null);
          setEnviado(false);
        }
      }}
    >
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-amber text-navy hover:bg-amber-soft/40"
      >
        Avaliar
      </Button>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-sm">
        {enviado ? (
          <div className="text-center">
            <DialogHeader>
              <DialogTitle className="text-center font-serif text-xl font-normal text-navy">
                Obrigado!
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-ink-soft">
              Sua avaliação entrou em análise e aparece pra outras famílias assim que for aprovada.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-full bg-amber py-2 text-sm font-bold text-navy"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg font-normal text-navy">
                Avaliar {motoristaNome}
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-soft">
                Sua nota ajuda outras famílias a escolher com confiança.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNota(n)}
                  onMouseEnter={() => setNotaHover(n)}
                  onMouseLeave={() => setNotaHover(0)}
                  className="p-0.5"
                  aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className={
                      "h-8 w-8 transition " +
                      (n <= (notaHover || nota) ? "fill-amber text-amber" : "text-cream-line")
                    }
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte como foi a experiência (opcional)"
              rows={3}
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
                onClick={enviar}
                className="flex-1 rounded-full bg-amber py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
