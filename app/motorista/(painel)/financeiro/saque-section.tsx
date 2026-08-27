"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";

type Saque = {
  id: string;
  valorCentavos: number;
  status: "PENDENTE" | "PAGO";
  createdAt: string;
  pagoEm: string | null;
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SaqueSection({ saldoCentavos, saques }: { saldoCentavos: number; saques: Saque[] }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function solicitar() {
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/motorista/saques", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra solicitar o saque.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra solicitar o saque.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-soft text-sage">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-ink-soft">Saldo disponível pra saque</p>
            <p className="font-serif text-2xl text-navy">{formatarReais(saldoCentavos)}</p>
          </div>
        </div>
        <Button
          disabled={enviando || saldoCentavos === 0}
          onClick={solicitar}
          className="bg-navy text-white hover:bg-navy/90 disabled:opacity-50"
        >
          {enviando ? "Solicitando..." : "Solicitar saque"}
        </Button>
      </div>
      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
      <p className="mt-2 text-xs text-ink-soft">
        Vira saldo assim que um pai paga pelo Asaas. O Pix é feito manualmente pela Mova depois do
        pedido, sem valor automático nem prazo fixo ainda.
      </p>

      {saques.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-cream-line pt-3">
          {saques.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="text-ink-soft">
                {new Date(s.createdAt).toLocaleDateString("pt-BR")} · {formatarReais(s.valorCentavos)}
              </span>
              {s.status === "PAGO" ? (
                <Badge variant="outline" className="border-transparent bg-sage-soft text-[10px] font-semibold text-sage">
                  Pago{s.pagoEm ? ` em ${new Date(s.pagoEm).toLocaleDateString("pt-BR")}` : ""}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-transparent bg-amber-soft text-[10px] font-semibold text-navy">
                  Aguardando Pix
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
