"use client";

import { useState } from "react";

type Escola = { id: string; nome: string };

export default function PerfilForm({
  motorista,
}: {
  motorista: {
    anosExperiencia: number;
    temMonitor: boolean;
    precoMin: number | null;
    precoMax: number | null;
    escolas: Escola[];
  };
}) {
  const [anosExperiencia, setAnosExperiencia] = useState(motorista.anosExperiencia);
  const [temMonitor, setTemMonitor] = useState(motorista.temMonitor);
  const [precoMin, setPrecoMin] = useState(motorista.precoMin ? String(motorista.precoMin / 100) : "");
  const [precoMax, setPrecoMax] = useState(motorista.precoMax ? String(motorista.precoMax / 100) : "");
  const [escolas, setEscolas] = useState<Escola[]>(motorista.escolas);
  const [buscaEscola, setBuscaEscola] = useState("");
  const [sugestoes, setSugestoes] = useState<Escola[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function buscarEscolas(texto: string) {
    setBuscaEscola(texto);
    if (texto.trim().length < 2) {
      setSugestoes([]);
      return;
    }
    const res = await fetch(`/api/escolas?q=${encodeURIComponent(texto)}`);
    const data = await res.json();
    setSugestoes(data.escolas.filter((e: Escola) => !escolas.some((x) => x.id === e.id)));
  }

  function adicionarEscola(e: Escola) {
    setEscolas((prev) => [...prev, e]);
    setBuscaEscola("");
    setSugestoes([]);
  }
  function removerEscola(id: string) {
    setEscolas((prev) => prev.filter((e) => e.id !== id));
  }

  async function salvar() {
    setMensagem(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/motorista/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anosExperiencia,
          temMonitor,
          precoMin: precoMin ? Math.round(parseFloat(precoMin) * 100) : null,
          precoMax: precoMax ? Math.round(parseFloat(precoMax) * 100) : null,
          escolaIds: escolas.map((e) => e.id),
        }),
      });
      if (!res.ok) throw new Error();
      setMensagem("Perfil salvo!");
    } catch {
      setMensagem("Não deu pra salvar. Tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-8 max-w-lg space-y-5 rounded-2xl border border-cream-line bg-white p-6">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Anos de experiência
        </label>
        <input
          type="number"
          min={0}
          value={anosExperiencia}
          onChange={(e) => setAnosExperiencia(Number(e.target.value))}
          className="w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm"
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={temMonitor}
          onChange={(e) => setTemMonitor(e.target.checked)}
          className="h-4 w-4 accent-amber"
        />
        <span className="text-sm text-ink-soft">Tenho monitor a bordo</span>
      </label>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Faixa de preço (R$/mês)
        </label>
        <div className="flex gap-2">
          <input
            value={precoMin}
            onChange={(e) => setPrecoMin(e.target.value)}
            placeholder="Mínimo"
            className="w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm"
          />
          <input
            value={precoMax}
            onChange={(e) => setPrecoMax(e.target.value)}
            placeholder="Máximo"
            className="w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Escolas que você atende
        </label>
        <div className="flex flex-wrap gap-2">
          {escolas.map((e) => (
            <span key={e.id} className="flex items-center gap-1 rounded-full bg-sage-soft px-3 py-1 text-xs text-sage">
              {e.nome}
              <button onClick={() => removerEscola(e.id)} className="ml-1 text-sage/70">×</button>
            </span>
          ))}
        </div>
        <div className="relative mt-2">
          <input
            value={buscaEscola}
            onChange={(e) => buscarEscolas(e.target.value)}
            placeholder="Buscar escola pra adicionar"
            className="w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm"
          />
          {sugestoes.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-cream-line bg-white shadow-lg">
              {sugestoes.map((e) => (
                <button
                  key={e.id}
                  onClick={() => adicionarEscola(e)}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-cream"
                >
                  {e.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        Documentação (CNH, curso, antecedentes) é verificada pela equipe Levva
        separadamente — não pode ser editada aqui.
      </p>

      {mensagem && <p className="text-sm text-sage">{mensagem}</p>}

      <button
        onClick={salvar}
        disabled={salvando}
        className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar perfil"}
      </button>
    </div>
  );
}
