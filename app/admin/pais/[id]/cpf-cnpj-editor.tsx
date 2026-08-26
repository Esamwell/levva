"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, IdCard } from "lucide-react";

export default function CpfCnpjEditor({ paiId, valorAtual }: { paiId: string; valorAtual: string | null }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorAtual ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/pais/${paiId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpfCnpj: valor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "CPF/CNPJ inválido.");
      setEditando(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft hover:text-navy"
      >
        <IdCard className="h-3.5 w-3.5" />
        {valorAtual ? `CPF/CNPJ: ${valorAtual}` : "CPF/CNPJ não cadastrado"}
        <Pencil className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Só números"
          className="w-40 rounded-lg border border-cream-line px-2.5 py-1 text-xs outline-none focus:border-amber"
        />
        <button
          type="button"
          disabled={salvando}
          onClick={salvar}
          className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setValor(valorAtual ?? "");
            setErro(null);
          }}
          className="text-xs font-semibold text-ink-soft"
        >
          Cancelar
        </button>
      </div>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
