"use client";

import { useState } from "react";
import { School } from "lucide-react";
import { Card, CardContent, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Separator } from "../../../../components/ui/separator";
import { cn } from "../../../../lib/utils";
import { contemContato } from "../../../../lib/texto";

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
    pagadorTaxaPadrao: "MOTORISTA" | "PAI";
    bio: string | null;
  };
}) {
  const [anosExperiencia, setAnosExperiencia] = useState(motorista.anosExperiencia);
  const [temMonitor, setTemMonitor] = useState(motorista.temMonitor);
  const [bio, setBio] = useState(motorista.bio ?? "");
  const [precoMin, setPrecoMin] = useState(motorista.precoMin ? String(motorista.precoMin / 100) : "");
  const [precoMax, setPrecoMax] = useState(motorista.precoMax ? String(motorista.precoMax / 100) : "");
  const [escolas, setEscolas] = useState<Escola[]>(motorista.escolas);
  const [buscaEscola, setBuscaEscola] = useState("");
  const [sugestoes, setSugestoes] = useState<Escola[]>([]);
  const [pagadorTaxaPadrao, setPagadorTaxaPadrao] = useState(motorista.pagadorTaxaPadrao);

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
    if (contemContato(bio)) {
      setMensagem("Tira telefone, e-mail, link ou @ da descrição — só um textinho sobre você.");
      return;
    }
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
          pagadorTaxaPadrao,
          bio: bio.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : undefined);
      setMensagem("Perfil salvo!");
    } catch (e) {
      setMensagem(e instanceof Error && e.message ? e.message : "Não deu pra salvar. Tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card className="mt-8 max-w-lg border-cream-line shadow-none">
      <CardContent className="space-y-6 p-6">
        <section className="space-y-4">
          <CardTitle className="text-sm uppercase tracking-wide text-ink-soft">Sobre você</CardTitle>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Anos de experiência
            </label>
            <input
              type="number"
              min={0}
              value={anosExperiencia}
              onChange={(e) => setAnosExperiencia(Number(e.target.value))}
              className="w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm outline-none focus:border-amber"
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
              Descrição (opcional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Um textinho curto contando um pouco sobre você e como trabalha."
              className="w-full resize-none rounded-xl border border-cream-line px-4 py-2.5 text-sm outline-none focus:border-amber"
            />
            <p className="mt-1 text-xs text-ink-soft">
              Aparece no seu perfil público. Nada de telefone, e-mail, link ou @ — o contato só libera depois que a
              família paga, pelo chat da Mova.
            </p>
          </div>
        </section>

        <Separator className="bg-cream-line" />

        <section className="space-y-2">
          <CardTitle className="text-sm uppercase tracking-wide text-ink-soft">Faixa de preço (R$/mês)</CardTitle>
          <div className="flex gap-2">
            <input
              value={precoMin}
              onChange={(e) => setPrecoMin(e.target.value)}
              placeholder="Mínimo"
              className="w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm outline-none focus:border-amber"
            />
            <input
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              placeholder="Máximo"
              className="w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm outline-none focus:border-amber"
            />
          </div>
        </section>

        <Separator className="bg-cream-line" />

        <section className="space-y-2">
          <CardTitle className="text-sm uppercase tracking-wide text-ink-soft">Escolas que você atende</CardTitle>
          <div className="flex flex-wrap gap-2">
            {escolas.map((e) => (
              <span key={e.id} className="flex items-center gap-1 rounded-full bg-sage-soft px-3 py-1 text-xs text-sage">
                <School className="h-3 w-3" /> {e.nome}
                <button onClick={() => removerEscola(e.id)} className="ml-1 text-sage/70">×</button>
              </span>
            ))}
          </div>
          <div className="relative">
            <input
              value={buscaEscola}
              onChange={(e) => buscarEscolas(e.target.value)}
              placeholder="Buscar escola pra adicionar"
              className="w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm outline-none focus:border-amber"
            />
            {sugestoes.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-cream-line bg-white shadow-lg">
                {sugestoes.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => adicionarEscola(e)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-cream"
                  >
                    <School className="h-3.5 w-3.5 text-ink-soft" /> {e.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <Separator className="bg-cream-line" />

        <section className="space-y-2">
          <CardTitle className="text-sm uppercase tracking-wide text-ink-soft">Taxa da Mova nos seus contratos</CardTitle>
          <p className="text-xs text-ink-soft">
            Quando você fecha um contrato, essa é a opção que já vem marcada. Dá pra trocar contrato a contrato se precisar.
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setPagadorTaxaPadrao("MOTORISTA")}
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                pagadorTaxaPadrao === "MOTORISTA" ? "border-navy bg-cream" : "border-cream-line hover:border-amber"
              )}
            >
              <span className="font-semibold text-navy">Eu absorvo</span>
              <span className="block text-xs text-ink-soft">A taxa desconta da minha parte</span>
            </button>
            <button
              type="button"
              onClick={() => setPagadorTaxaPadrao("PAI")}
              className={cn(
                "w-full rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                pagadorTaxaPadrao === "PAI" ? "border-navy bg-cream" : "border-cream-line hover:border-amber"
              )}
            >
              <span className="font-semibold text-navy">Repasso pro responsável</span>
              <span className="block text-xs text-ink-soft">A taxa soma no valor cobrado da família</span>
            </button>
          </div>
        </section>

        <p className="text-xs text-ink-soft">
          Documentação (CNH, curso, antecedentes) é verificada pela equipe Mova
          separadamente. Atualize em "Documentos", no menu.
        </p>

        {mensagem && <p className="text-sm text-sage">{mensagem}</p>}

        <Button onClick={salvar} disabled={salvando} className="bg-navy text-white hover:bg-navy/90">
          {salvando ? "Salvando..." : "Salvar perfil"}
        </Button>
      </CardContent>
    </Card>
  );
}
