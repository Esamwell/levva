"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, MapPin, Users, Car } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { MapaPicker } from "../../../components/mapa-picker";

type Escola = {
  id: string;
  nome: string;
  bairro: string;
  cidade: string;
  lat: number;
  lng: number;
  filhos: number;
  transportadores: number;
};

type Sugestao = { label: string; nome: string; bairro: string; cidade: string; lat: number; lng: number };

// Centro de Salvador — ponto de partida do mapa pra escola nova, antes de
// buscar ou clicar em algum lugar específico.
const CENTRO_PADRAO = { lat: -12.9714, lng: -38.5014 };

function EscolaForm({
  escola,
  onClose,
  onSalvo,
}: {
  escola: Escola | null;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const editando = escola !== null;
  const [nome, setNome] = useState(escola?.nome ?? "");
  const [bairro, setBairro] = useState(escola?.bairro ?? "");
  const [cidade, setCidade] = useState(escola?.cidade ?? "Salvador");
  const [lat, setLat] = useState(escola?.lat ?? CENTRO_PADRAO.lat);
  const [lng, setLng] = useState(escola?.lng ?? CENTRO_PADRAO.lng);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [buscaEndereco, setBuscaEndereco] = useState("");
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [buscandoSugestao, setBuscandoSugestao] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onDigitarEndereco(texto: string) {
    setBuscaEndereco(texto);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (texto.trim().length < 3) {
      setSugestoes([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscandoSugestao(true);
      try {
        const res = await fetch(`/api/admin/sugestoes-endereco?q=${encodeURIComponent(texto)}`);
        const data = await res.json();
        setSugestoes(data.sugestoes ?? []);
      } finally {
        setBuscandoSugestao(false);
      }
    }, 400);
  }

  function escolherSugestao(s: Sugestao) {
    if (s.nome) setNome(s.nome);
    if (s.bairro) setBairro(s.bairro);
    if (s.cidade) setCidade(s.cidade);
    setLat(s.lat);
    setLng(s.lng);
    setBuscaEndereco("");
    setSugestoes([]);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(editando ? `/api/admin/escolas/${escola.id}` : "/api/admin/escolas", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, bairro, cidade, lat, lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não deu pra salvar.");
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu pra salvar.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <form onSubmit={salvar} className="space-y-3">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-navy">
              {editando ? "Editar escola" : "Nova escola"}
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <input
              value={buscaEndereco}
              onChange={(e) => onDigitarEndereco(e.target.value)}
              placeholder="Buscar endereço ou nome da escola"
              className={campo}
            />
            {(sugestoes.length > 0 || buscandoSugestao) && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-cream-line bg-white shadow-lg">
                {buscandoSugestao && <p className="px-4 py-2 text-xs text-ink-soft">Buscando...</p>}
                {sugestoes.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => escolherSugestao(s)}
                    className="flex w-full items-start gap-2 px-4 py-2 text-left text-sm hover:bg-cream"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-ink-soft">
            Escolhendo uma sugestão preenche os campos abaixo e posiciona o pino — arraste ou clique no mapa pra ajustar.
          </p>

          <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da escola" className={campo} />
          <div className="flex gap-2">
            <input required value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className={campo} />
            <input required value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className={campo} />
          </div>

          <MapaPicker lat={lat} lng={lng} onMudar={(la, ln) => { setLat(la); setLng(ln); }} />
          <p className="font-mono text-[11px] text-ink-soft">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-cream-line py-2 text-sm font-semibold text-ink-soft">
              Cancelar
            </button>
            <Button disabled={enviando} className="flex-1 bg-navy text-white hover:bg-navy/90">
              {enviando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function EscolasList({ escolas: escolasIniciais }: { escolas: Escola[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState<"nova" | Escola | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return escolasIniciais;
    return escolasIniciais.filter(
      (e) => e.nome.toLowerCase().includes(termo) || e.bairro.toLowerCase().includes(termo)
    );
  }, [escolasIniciais, busca]);

  async function excluir(escola: Escola) {
    if (!window.confirm(`Excluir "${escola.nome}"?`)) return;
    setProcessando(escola.id);
    try {
      const res = await fetch(`/api/admin/escolas/${escola.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.error || "Não deu pra excluir.");
        return;
      }
      router.refresh();
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou bairro"
            className="w-full rounded-full border border-cream-line py-2 pl-9 pr-4 text-sm outline-none focus:border-amber"
          />
        </div>
        <Button onClick={() => setFormAberto("nova")} className="bg-navy text-white hover:bg-navy/90">
          <Plus className="h-4 w-4" /> Nova escola
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {filtradas.length === 0 ? (
          <EmptyState icon={MapPin} title="Nenhuma escola aqui" description="Muda a busca ou cadastra uma nova." />
        ) : (
          filtradas.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy">{e.nome}</p>
                <p className="truncate text-xs text-ink-soft">
                  {e.bairro}, {e.cidade}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="flex items-center gap-1 text-xs text-ink-soft" title="Alunos matriculados">
                  <Users className="h-3.5 w-3.5" /> {e.filhos}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-soft" title="Motoristas que atendem">
                  <Car className="h-3.5 w-3.5" /> {e.transportadores}
                </span>
                <button onClick={() => setFormAberto(e)} className="text-ink-soft hover:text-navy" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => excluir(e)}
                  disabled={processando === e.id}
                  className="text-ink-soft hover:text-red-600 disabled:opacity-40"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {formAberto && (
        <EscolaForm
          escola={formAberto === "nova" ? null : formAberto}
          onClose={() => setFormAberto(null)}
          onSalvo={() => {
            setFormAberto(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
