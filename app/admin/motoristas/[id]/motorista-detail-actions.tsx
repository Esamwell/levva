"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { ReprovarDialog } from "../../../../components/reprovar-dialog";

export default function MotoristaDetailActions({
  motoristaId,
  userId,
  statusAprovacao,
  ativo,
}: {
  motoristaId: string;
  userId: string;
  statusAprovacao: "PENDENTE" | "APROVADO" | "REPROVADO";
  ativo: boolean;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [dialogReprovar, setDialogReprovar] = useState(false);

  async function aprovar() {
    setCarregando("aprovar");
    setErro(null);
    try {
      const res = await fetch(`/api/admin/motoristas/${motoristaId}/aprovar`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setErro("Não foi possível aprovar.");
    } finally {
      setCarregando(null);
    }
  }

  async function reprovar(motivo: string) {
    setCarregando("reprovar");
    setErro(null);
    try {
      const res = await fetch(`/api/admin/motoristas/${motoristaId}/reprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      });
      if (!res.ok) throw new Error();
      setDialogReprovar(false);
      router.refresh();
    } catch {
      setErro("Não foi possível reprovar.");
    } finally {
      setCarregando(null);
    }
  }

  async function alternarAtivo() {
    const acao = ativo ? "desativar" : "ativar";
    if (ativo && !window.confirm("Desativar essa conta? O motorista some da busca e não consegue mais entrar.")) return;
    setCarregando(acao);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/${acao}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao atualizar.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setCarregando(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {statusAprovacao === "PENDENTE" && (
          <>
            <Button size="sm" disabled={!!carregando} onClick={aprovar} className="bg-sage text-white hover:bg-sage/90">
              Aprovar
            </Button>
            <Button size="sm" variant="outline" disabled={!!carregando} onClick={() => setDialogReprovar(true)} className="border-cream-line text-ink-soft hover:bg-cream">
              Reprovar
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={!!carregando}
          onClick={alternarAtivo}
          className={ativo ? "border-red-200 text-red-600 hover:bg-red-50" : "border-sage-soft text-sage hover:bg-sage-soft/40"}
        >
          {ativo ? "Desativar conta" : "Reativar conta"}
        </Button>
      </div>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
      <ReprovarDialog
        open={dialogReprovar}
        onOpenChange={setDialogReprovar}
        onConfirmar={reprovar}
        carregando={carregando === "reprovar"}
      />
    </div>
  );
}
