"use client";

/**
 * Tela de busca do pai: endereço + escola -> lista de transportadores
 * compatíveis. Gratuito e sem cadastro obrigatório — só pede os dados
 * de contato na hora de solicitar contato com um motorista específico.
 */

import { useState } from "react";

type Resultado = {
  id: string;
  nome: string;
  destaque: boolean;
  anosExperiencia: number;
  temMonitor: boolean;
  precoMin: number | null;
  precoMax: number | null;
  notaMedia: number | null;
  distanciaKm: number;
};

export default function BuscaPage() {
  const [endereco, setEndereco] = useState("");
  const [escola, setEscola] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [escolaEncontrada, setEscolaEncontrada] = useState<boolean | null>(null);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [escolaIdAtual, setEscolaIdAtual] = useState<string | null>(null);

  const [modalMotorista, setModalMotorista] = useState<Resultado | null>(null);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setBuscando(true);
    setResultados(null);
    try {
      const res = await fetch("/api/busca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endereco, escola }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na busca.");
      setEscolaEncontrada(data.escolaEncontrada);
      setResultados(data.resultados);
      setEscolaIdAtual(data.escolaId ?? null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Encontre o transporte do seu filho</h1>
      <p className="mt-2 text-ink-soft">
        Digite seu endereço e a escola — sem custo, sem cadastro obrigatório.
      </p>

      <form onSubmit={buscar} className="mt-8 max-w-md space-y-3 rounded-2xl border border-cream-line bg-white p-6">
        <input
          required
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Seu endereço, em Salvador"
          className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm outline-none focus:border-amber"
        />
        <input
          required
          value={escola}
          onChange={(e) => setEscola(e.target.value)}
          placeholder="Nome da escola"
          className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm outline-none focus:border-amber"
        />
        <button
          disabled={buscando}
          className="w-full rounded-xl bg-navy py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar transportadores"}
        </button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </form>

      {resultados !== null && (
        <div className="mt-8 max-w-2xl">
          {escolaEncontrada === false && (
            <p className="text-sm text-ink-soft">
              Ainda não temos essa escola no nosso cadastro. Deixa seu contato que
              avisamos assim que tivermos transportadores por aí.
            </p>
          )}
          {escolaEncontrada && resultados.length === 0 && (
            <p className="text-sm text-ink-soft">
              Nenhum transportador verificado atende essa região ainda pra essa
              escola. Tente de novo em breve.
            </p>
          )}
          <div className="space-y-4">
            {resultados.map((m) => (
              <div key={m.id} className="rounded-2xl border border-cream-line bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-serif text-lg text-navy">
                      {m.nome} {m.destaque && <span className="ml-1 text-xs font-sans font-semibold text-amber">★ destaque</span>}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {m.anosExperiencia} anos de experiência ·{" "}
                      {m.temMonitor ? "Com monitor" : "Sem monitor"} ·{" "}
                      {m.distanciaKm.toFixed(1)} km da escola
                    </p>
                    {m.notaMedia && (
                      <p className="mt-1 text-xs text-ink-soft">★ {m.notaMedia.toFixed(1)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setModalMotorista(m)}
                    className="shrink-0 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white"
                  >
                    Solicitar contato
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalMotorista && escolaIdAtual && (
        <ModalContato
          motorista={modalMotorista}
          escolaId={escolaIdAtual}
          enderecoInicial={endereco}
          onClose={() => setModalMotorista(null)}
        />
      )}
    </div>
  );
}

function ModalContato({
  motorista,
  escolaId,
  enderecoInicial,
  onClose,
}: {
  motorista: Resultado;
  escolaId: string;
  enderecoInicial: string;
  onClose: () => void;
}) {
  const [nomePai, setNomePai] = useState("");
  const [telefonePai, setTelefonePai] = useState("");
  const [enderecoPai, setEnderecoPai] = useState(enderecoInicial);
  const [nomeFilho, setNomeFilho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomePai,
          telefonePai,
          enderecoPai,
          nomeFilho,
          escolaId,
          motoristaId: motorista.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não deu pra enviar.");
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        {enviado ? (
          <div className="text-center">
            <p className="font-serif text-xl text-navy">Solicitação enviada!</p>
            <p className="mt-2 text-sm text-ink-soft">
              {motorista.nome} vai receber seu contato em breve.
            </p>
            <button onClick={onClose} className="mt-5 rounded-full bg-navy px-5 py-2 text-sm font-bold text-white">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-3">
            <p className="font-serif text-lg text-navy">Contato com {motorista.nome}</p>
            <input required value={nomePai} onChange={(e) => setNomePai(e.target.value)} placeholder="Seu nome" className="w-full rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber" />
            <input required value={telefonePai} onChange={(e) => setTelefonePai(e.target.value)} placeholder="Seu WhatsApp" className="w-full rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber" />
            <input required value={enderecoPai} onChange={(e) => setEnderecoPai(e.target.value)} placeholder="Seu endereço" className="w-full rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber" />
            <input required value={nomeFilho} onChange={(e) => setNomeFilho(e.target.value)} placeholder="Nome do seu filho(a)" className="w-full rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber" />
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 rounded-full border border-cream-line py-2 text-sm font-semibold text-ink-soft">
                Cancelar
              </button>
              <button disabled={enviando} className="flex-1 rounded-full bg-amber py-2 text-sm font-bold text-navy disabled:opacity-50">
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
