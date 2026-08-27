"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardTitle } from "../../../../components/ui/card";
import { EnderecoAutocomplete, type PontoEndereco } from "../../../../components/endereco-autocomplete";
import { MapaPicker } from "../../../../components/mapa-picker";

type Area = { id: string; nome: string; lat: number; lng: number; raioKm: number };

const CENTRO_PADRAO = { lat: -12.9714, lng: -38.5014 };

function NovaAreaForm({ onCancelar, onAdicionada }: { onCancelar: () => void; onAdicionada: (area: Area) => void }) {
  const [busca, setBusca] = useState("");
  const [ponto, setPonto] = useState<PontoEndereco | null>(null);
  const [raioKm, setRaioKm] = useState(5);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!busca.trim() || !ponto) {
      setErro("Busca um endereço ou bairro e escolhe uma sugestão.");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/motorista/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: busca, lat: ponto.lat, lng: ponto.lng, raioKm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra salvar.");
      onAdicionada(data.area);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const centro = ponto ?? CENTRO_PADRAO;

  return (
    <div className="space-y-3 rounded-xl border border-cream-line p-4">
      <EnderecoAutocomplete
        value={busca}
        onChangeText={setBusca}
        onPonto={setPonto}
        placeholder="Bairro ou região, ex.: Rio Vermelho"
        className="w-full rounded-lg border border-cream-line px-3.5 py-2.5 text-sm outline-none focus:border-amber"
      />

      {ponto && (
        <>
          <MapaPicker lat={centro.lat} lng={centro.lng} onMudar={() => {}} raioKm={raioKm} />
          <div>
            <div className="flex items-center justify-between text-xs text-ink-soft">
              <span>Raio de atendimento</span>
              <span className="font-semibold text-navy">{raioKm} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={raioKm}
              onChange={(e) => setRaioKm(Number(e.target.value))}
              className="mt-1 w-full accent-amber"
            />
          </div>
        </>
      )}

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 rounded-full border border-cream-line py-2 text-xs font-semibold text-ink-soft"
        >
          Cancelar
        </button>
        <Button size="sm" disabled={salvando || !ponto} onClick={salvar} className="flex-1 bg-navy text-white hover:bg-navy/90">
          {salvando ? "Salvando..." : "Adicionar área"}
        </Button>
      </div>
    </div>
  );
}

export default function AreasAtendimentoForm({ areas: areasIniciais }: { areas: Area[] }) {
  const router = useRouter();
  const [areas, setAreas] = useState(areasIniciais);
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  async function remover(id: string) {
    setRemovendo(id);
    try {
      const res = await fetch(`/api/motorista/areas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAreas((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silencioso — lista já reflete o servidor no próximo refresh manual
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <Card className="mt-6 max-w-lg border-cream-line shadow-none">
      <CardContent className="space-y-3 p-6">
        <CardTitle className="text-sm uppercase tracking-wide text-ink-soft">Área de atendimento</CardTitle>
        <p className="text-xs text-ink-soft">
          Você pode atender uma escola mas só pegar passageiro de um bairro específico. Adicione os
          bairros ou regiões de onde você realmente busca criança — a busca do pai cruza o endereço
          dele com essas áreas, não só a escola.
        </p>

        {areas.length > 0 && (
          <ul className="space-y-2">
            {areas.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-cream-line px-3.5 py-2.5">
                <span className="flex min-w-0 items-center gap-1.5 text-sm text-navy">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-sage" />
                  <span className="truncate">{a.nome}</span>
                  <span className="shrink-0 text-xs text-ink-soft">· {a.raioKm} km</span>
                </span>
                <button
                  type="button"
                  disabled={removendo === a.id}
                  onClick={() => remover(a.id)}
                  className="shrink-0 text-ink-soft hover:text-red-600"
                  aria-label="Remover área"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {areas.length === 0 && !adicionando && (
          <p className="text-xs text-ink-soft">
            Nenhuma área cadastrada ainda — sem isso, você aparece pra qualquer família da escola,
            não importa a distância até ela.
          </p>
        )}

        {adicionando ? (
          <NovaAreaForm
            onCancelar={() => setAdicionando(false)}
            onAdicionada={(area) => {
              setAreas((prev) => [...prev, area]);
              setAdicionando(false);
              router.refresh();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdicionando(true)}
            className="flex items-center gap-1.5 rounded-full border border-cream-line px-4 py-2 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar área
          </button>
        )}
      </CardContent>
    </Card>
  );
}
