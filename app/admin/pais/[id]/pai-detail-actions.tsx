"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";

export default function PaiDetailActions({ userId, ativo }: { userId: string; ativo: boolean }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alternarAtivo() {
    const acao = ativo ? "desativar" : "ativar";
    if (ativo && !window.confirm("Desativar essa conta? O pai não consegue mais entrar.")) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/${acao}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao atualizar.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        size="sm"
        variant="outline"
        disabled={carregando}
        onClick={alternarAtivo}
        className={ativo ? "border-red-200 text-red-600 hover:bg-red-50" : "border-sage-soft text-sage hover:bg-sage-soft/40"}
      >
        {ativo ? "Desativar conta" : "Reativar conta"}
      </Button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
