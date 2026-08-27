"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Clock } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../../components/ui/dialog";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const BENEFICIOS = [
  "No topo dos resultados de busca, na frente de quem não tem destaque",
  "Selo de destaque visível no seu perfil pras famílias",
  "Suporte prioritário: seus chamados sobem na fila de atendimento",
];

export default function DestaqueCard({
  status,
  valorCentavos,
}: {
  status: "PENDENTE" | "ATIVO" | null;
  valorCentavos: number;
}) {
  const router = useRouter();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function contratar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/motorista/extras/destaque/ativar", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra contratar.");
      setDialogAberto(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra contratar.");
    } finally {
      setCarregando(false);
    }
  }

  async function cancelar() {
    const msg =
      status === "ATIVO"
        ? "Cancelar o destaque? Você sai do topo da busca e perde o selo e o suporte prioritário."
        : "Cancelar essa contratação?";
    if (!window.confirm(msg)) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/motorista/extras/destaque/cancelar", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra cancelar.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra cancelar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-soft/40 text-navy">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        </div>
        {status === "ATIVO" && (
          <Badge variant="outline" className="border-transparent bg-sage-soft font-semibold text-sage">
            Ativo
          </Badge>
        )}
        {status === "PENDENTE" && (
          <Badge variant="outline" className="border-transparent bg-amber-soft font-semibold text-navy">
            Aguardando pagamento
          </Badge>
        )}
      </div>
      <p className="mt-3 font-serif text-lg text-navy">Destaque</p>
      <p className="mt-1 text-sm text-ink-soft">Coloque seu perfil na frente de quem está procurando transporte.</p>

      <ul className="mt-3 space-y-1.5">
        {BENEFICIOS.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs text-ink-soft">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" strokeWidth={2.5} />
            {b}
          </li>
        ))}
      </ul>

      <p className="mt-3 font-serif text-2xl text-navy">
        {formatarReais(valorCentavos)}
        <span className="text-sm font-normal text-ink-soft">/mês</span>
      </p>

      {status === "PENDENTE" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
          <Clock className="h-3.5 w-3.5" /> Nossa equipe vai combinar o pagamento com você e ativar em seguida.
        </p>
      )}

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      {status === null ? (
        <Button size="sm" onClick={() => setDialogAberto(true)} className="mt-4 bg-navy text-white hover:bg-navy/90">
          Contratar destaque
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={carregando}
          onClick={cancelar}
          className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
        >
          {carregando ? "Aguarde..." : "Cancelar"}
        </Button>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-navy">Contratar destaque</DialogTitle>
            <DialogDescription className="text-xs text-ink-soft">
              Sem Asaas integrado ainda pra esse pagamento: combine direto com a equipe Mova, e assim que
              confirmado o destaque liga automaticamente no seu perfil.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-cream px-4 py-3 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-ink-soft">Destaque</span>
              <span className="font-semibold text-navy">{formatarReais(valorCentavos)}/mês</span>
            </p>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDialogAberto(false)}
              className="flex-1 rounded-full border border-cream-line py-2 text-sm font-semibold text-ink-soft"
            >
              Cancelar
            </button>
            <button
              disabled={carregando}
              onClick={contratar}
              className="flex-1 rounded-full bg-amber py-2 text-sm font-bold text-navy disabled:opacity-50"
            >
              {carregando ? "Enviando..." : "Confirmar contratação"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
