"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "../../../components/ui/button";

type Extra = {
  id: string;
  tipo: string;
  valorCentavos: number;
  periodicidade: "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
  createdAt: string;
  motoristaId: string;
  motoristaNome: string;
};

const TIPO_LABEL: Record<string, string> = { DESTAQUE: "Destaque" };
const PERIODO_LABEL: Record<Extra["periodicidade"], string> = {
  MENSAL: "mês",
  TRIMESTRAL: "trimestre",
  SEMESTRAL: "semestre",
  ANUAL: "ano",
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ExtrasPendentesList({ extras }: { extras: Extra[] }) {
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);

  async function confirmar(id: string) {
    setProcessando(id);
    try {
      const res = await fetch(`/api/admin/extras/${id}/confirmar`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-amber bg-amber-soft/15 p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg text-navy">
        <Clock className="h-4 w-4" /> Extras aguardando confirmação de pagamento
      </h2>
      <div className="mt-3 space-y-2">
        {extras.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-line bg-white px-4 py-3">
            <div>
              <p className="text-sm">
                <Link href={`/admin/motoristas/${e.motoristaId}`} className="font-semibold text-navy hover:underline">
                  {e.motoristaNome}
                </Link>{" "}
                <span className="text-ink-soft">contratou</span> {TIPO_LABEL[e.tipo] ?? e.tipo}
              </p>
              <p className="text-xs text-ink-soft">
                {formatarReais(e.valorCentavos)}/{PERIODO_LABEL[e.periodicidade]} · pedido em{" "}
                {new Date(e.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <Button
              size="sm"
              disabled={processando === e.id}
              onClick={() => confirmar(e.id)}
              className="bg-sage text-white hover:bg-sage/90"
            >
              {processando === e.id ? "Confirmando..." : "Confirmar pagamento"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
