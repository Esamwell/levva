"use client";

/**
 * Tela de busca do pai: endereço + escola -> lista de transportadores
 * compatíveis. Buscar é gratuito e não exige cadastro.
 *
 * A conta entra só na hora de solicitar contato — e agora é um cadastro
 * explícito, com senha. Antes a conta do pai era criada escondida dentro
 * do endpoint de leads, sem ele escolher senha nem saber que passou a ter
 * acesso ao sistema.
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
  distanciaKm: number | null;
};

export default function BuscaClient({ jaLogado }: { jaLogado: boolean }) {
  const [endereco, setEndereco] = useState("");
  const [escola, setEscola] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [escolaEncontrada, setEscolaEncontrada] = useState<boolean | null>(null);
  // false = geocoding não reconheceu o endereço; a lista vem sem filtro de raio.
  const [enderecoLocalizado, setEnderecoLocalizado] = useState<boolean>(true);
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
      setEnderecoLocalizado(data.enderecoLocalizado !== false);
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
          {escolaEncontrada && !enderecoLocalizado && resultados.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber bg-amber-soft/25 px-4 py-3 text-sm text-navy">
              Não conseguimos localizar seu endereço no mapa, então estes são{" "}
              <strong>todos os transportadores que atendem essa escola</strong>, sem
              ordenar por distância. Tente incluir o bairro para ver quem está mais perto.
            </div>
          )}
          {escolaEncontrada && resultados.length === 0 && (
            <p className="text-sm text-ink-soft">
              Nenhum transportador verificado atende essa escola ainda.
              Tente de novo em breve.
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
                      {m.temMonitor ? "Com monitor" : "Sem monitor"}
                      {m.distanciaKm !== null && ` · ${m.distanciaKm.toFixed(1)} km da escola`}
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
          jaLogado={jaLogado}
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
  jaLogado,
  enderecoInicial,
  onClose,
}: {
  motorista: Resultado;
  escolaId: string;
  jaLogado: boolean;
  enderecoInicial: string;
  onClose: () => void;
}) {
  const [nomePai, setNomePai] = useState("");
  const [emailPai, setEmailPai] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [telefonePai, setTelefonePai] = useState("");
  const [enderecoPai, setEnderecoPai] = useState(enderecoInicial);
  const [nomeFilho, setNomeFilho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const senhaOk = senha.length >= 8 && /[a-zA-Z]/.test(senha) && /[0-9]/.test(senha);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!jaLogado && !senhaOk) {
      setErro("A senha precisa ter 8 caracteres, com uma letra e um número.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      // Quem já está logado manda só a solicitação; quem não está manda
      // também os dados da conta, e sai daqui cadastrado e com sessão aberta.
      const corpo = jaLogado
        ? { enderecoPai, nomeFilho, escolaId, motoristaId: motorista.id }
        : {
            nomePai,
            emailPai,
            senha,
            telefonePai,
            enderecoPai,
            nomeFilho,
            escolaId,
            motoristaId: motorista.id,
          };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Não deu pra enviar."
        );
      }
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setEnviando(false);
    }
  }

  const campo =
    "w-full rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        {enviado ? (
          <div className="text-center">
            <p className="font-serif text-xl text-navy">Solicitação enviada!</p>
            <p className="mt-2 text-sm text-ink-soft">
              {motorista.nome} vai receber seu contato em breve. Acompanhe o
              andamento pelo seu painel.
            </p>
            <a
              href="/pai/dashboard"
              className="mt-5 block rounded-full bg-amber py-2 text-sm font-bold text-navy"
            >
              Ver minhas solicitações
            </a>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-full py-2 text-sm font-semibold text-ink-soft"
            >
              Continuar buscando
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-3">
            <div>
              <p className="font-serif text-lg text-navy">Contato com {motorista.nome}</p>
              {!jaLogado && (
                <p className="mt-1 text-xs text-ink-soft">
                  Criamos sua conta para você acompanhar a solicitação.{" "}
                  <a href="/entrar" className="font-semibold text-sage">
                    Já tem conta? Entrar
                  </a>
                </p>
              )}
            </div>

            {!jaLogado && (
              <>
                <input
                  required
                  value={nomePai}
                  onChange={(e) => setNomePai(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  className={campo}
                />
                <input
                  required
                  type="email"
                  value={emailPai}
                  onChange={(e) => setEmailPai(e.target.value)}
                  placeholder="Seu e-mail"
                  autoComplete="email"
                  className={campo}
                />
                <div className="relative">
                  <input
                    required
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Crie uma senha"
                    autoComplete="new-password"
                    className={campo + " pr-16"}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-soft hover:text-navy"
                  >
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {senha.length > 0 && !senhaOk && (
                  <p className="text-xs text-red-600">
                    Mínimo de 8 caracteres, com uma letra e um número.
                  </p>
                )}
                <input
                  required
                  value={telefonePai}
                  onChange={(e) => setTelefonePai(e.target.value)}
                  placeholder="Seu WhatsApp"
                  autoComplete="tel"
                  className={campo}
                />
              </>
            )}

            <input
              required
              value={enderecoPai}
              onChange={(e) => setEnderecoPai(e.target.value)}
              placeholder="Seu endereço"
              className={campo}
            />
            <input
              required
              value={nomeFilho}
              onChange={(e) => setNomeFilho(e.target.value)}
              placeholder="Nome do seu filho(a)"
              className={campo}
            />

            {erro && (
              <p role="alert" className="text-sm text-red-600">
                {erro}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-cream-line py-2 text-sm font-semibold text-ink-soft"
              >
                Cancelar
              </button>
              <button
                disabled={enviando}
                className="flex-1 rounded-full bg-amber py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
