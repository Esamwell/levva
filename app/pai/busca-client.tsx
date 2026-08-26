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

import { useRef, useState } from "react";
import { Star, Sparkles, School, Search, Check, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import SpotlightCard from "../../components/SpotlightCard";
import { TermosModal } from "../../components/termos-modal";
import { EnderecoAutocomplete, type PontoEndereco } from "../../components/endereco-autocomplete";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

type EscolaSugestao = { id: string; nome: string };

/** Autocomplete de escola já cadastrada — mesma lógica de app/pai/perfil/perfil-form.tsx,
 * mas devolvendo só o nome (é o que /api/busca espera), não o id. */
function EscolaAutocomplete({
  value,
  onChangeText,
  className,
}: {
  value: string;
  onChangeText: (texto: string) => void;
  className: string;
}) {
  const [sugestoes, setSugestoes] = useState<EscolaSugestao[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function digitar(texto: string) {
    onChangeText(texto);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (texto.trim().length < 2) {
      setSugestoes([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/escolas?q=${encodeURIComponent(texto)}`);
      const data = await res.json();
      setSugestoes(data.escolas ?? []);
    }, 300);
  }

  return (
    <div className="relative">
      <input
        required
        value={value}
        onChange={(e) => digitar(e.target.value)}
        placeholder="Nome da escola"
        className={className}
        autoComplete="off"
      />
      {sugestoes.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-cream-line bg-white shadow-lg">
          {sugestoes.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                onChangeText(e.nome);
                setSugestoes([]);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-cream"
            >
              <School className="h-3.5 w-3.5 shrink-0 text-ink-soft" /> {e.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function BuscaClient({ jaLogado }: { jaLogado: boolean }) {
  const [endereco, setEndereco] = useState("");
  const [enderecoPonto, setEnderecoPonto] = useState<PontoEndereco | null>(null);
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
        body: JSON.stringify({
          endereco,
          escola,
          ...(enderecoPonto ? { lat: enderecoPonto.lat, lng: enderecoPonto.lng } : {}),
        }),
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
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <h1 className="font-serif text-3xl text-navy">Encontre o transporte do seu filho</h1>
          <p className="mt-2 text-ink-soft">
            Digite seu endereço e a escola, sem custo, sem cadastro obrigatório.
          </p>

          <form onSubmit={buscar} className="mt-8 max-w-md space-y-3 rounded-2xl border border-cream-line bg-white p-6">
            <EnderecoAutocomplete
              value={endereco}
              onChangeText={setEndereco}
              onPonto={setEnderecoPonto}
              placeholder="Seu endereço, em Salvador"
              className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm outline-none focus:border-amber"
            />
            <EscolaAutocomplete
              value={escola}
              onChangeText={setEscola}
              className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm outline-none focus:border-amber"
            />
            <Button
              disabled={buscando}
              className="w-full bg-navy py-5 text-sm font-bold text-white hover:bg-navy/90 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {buscando ? "Buscando..." : "Buscar transportadores"}
            </Button>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
          </form>
        </div>

        {resultados === null && (
          <div className="rounded-2xl border border-cream-line bg-white p-6 lg:mt-[4.75rem]">
            <p className="font-mono text-xs uppercase tracking-wide text-sage">O que você vai ver</p>
            <ul className="mt-4 space-y-3.5">
              {[
                "Foto real do veículo e do motorista",
                "Selo de verificação documental",
                "Avaliações de outras famílias da região",
                "Escolas atendidas e faixa de preço, sem letra miúda",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 border-t border-cream-line pt-4 text-xs text-ink-soft">
              <ShieldCheck className="h-4 w-4 shrink-0 text-sage" />
              CNH, curso de transporte escolar e antecedentes checados antes de qualquer motorista aparecer aqui.
            </div>
          </div>
        )}
      </div>

      {resultados !== null && (
        <div className="mt-10 max-w-2xl">
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
              <SpotlightCard
                key={m.id}
                spotlightColor="rgba(254, 219, 26, 0.25)"
                className="flex items-start gap-4 rounded-2xl border border-cream-line bg-white p-5"
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-navy text-sm font-bold text-white">
                    {iniciais(m.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 font-serif text-lg text-navy">
                        {m.nome}
                        {m.destaque && (
                          <Badge className="gap-1 border-transparent bg-amber-soft text-[11px] font-semibold text-navy">
                            <Sparkles className="h-3 w-3" /> destaque
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {m.anosExperiencia} anos de experiência ·{" "}
                        {m.temMonitor ? "Com monitor" : "Sem monitor"}
                        {m.distanciaKm !== null && ` · ${m.distanciaKm.toFixed(1)} km da escola`}
                      </p>
                      {m.notaMedia && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                          <Star className="h-3.5 w-3.5 fill-amber text-amber" /> {m.notaMedia.toFixed(1)}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setModalMotorista(m)}
                      className="shrink-0 bg-navy text-xs font-bold text-white hover:bg-navy/90"
                    >
                      Solicitar contato
                    </Button>
                  </div>
                </div>
              </SpotlightCard>
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
          pontoInicial={enderecoPonto}
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
  pontoInicial,
  onClose,
}: {
  motorista: Resultado;
  escolaId: string;
  jaLogado: boolean;
  enderecoInicial: string;
  pontoInicial: PontoEndereco | null;
  onClose: () => void;
}) {
  const [nomePai, setNomePai] = useState("");
  const [emailPai, setEmailPai] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [telefonePai, setTelefonePai] = useState("");
  const [enderecoPai, setEnderecoPai] = useState(enderecoInicial);
  const [pontoPai, setPontoPai] = useState<PontoEndereco | null>(pontoInicial);
  const [nomeFilho, setNomeFilho] = useState("");
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [termosAbertos, setTermosAbertos] = useState(false);
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
    if (!jaLogado && !termosAceitos) {
      setErro("É preciso aceitar os Termos de Uso.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      // Quem já está logado manda só a solicitação; quem não está manda
      // também os dados da conta, e sai daqui cadastrado e com sessão aberta.
      const ponto = pontoPai ? { latPai: pontoPai.lat, lngPai: pontoPai.lng } : {};
      const corpo = jaLogado
        ? { enderecoPai, nomeFilho, escolaId, motoristaId: motorista.id, ...ponto }
        : {
            nomePai,
            emailPai,
            senha,
            telefonePai,
            enderecoPai,
            nomeFilho,
            escolaId,
            motoristaId: motorista.id,
            termosAceitos,
            ...ponto,
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-sm">
        {enviado ? (
          <div className="text-center">
            <DialogHeader>
              <DialogTitle className="text-center font-serif text-xl font-normal text-navy">
                Solicitação enviada!
              </DialogTitle>
            </DialogHeader>
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
            <DialogHeader>
              <DialogTitle className="font-serif text-lg font-normal text-navy">
                Contato com {motorista.nome}
              </DialogTitle>
              {!jaLogado && (
                <DialogDescription className="text-xs text-ink-soft">
                  Criamos sua conta para você acompanhar a solicitação.{" "}
                  <a href="/entrar" className="font-semibold text-sage">
                    Já tem conta? Entrar
                  </a>
                </DialogDescription>
              )}
            </DialogHeader>

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

            <EnderecoAutocomplete
              value={enderecoPai}
              onChangeText={setEnderecoPai}
              onPonto={setPontoPai}
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

            {!jaLogado && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-cream-line px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                  {termosAceitos ? (
                    <>
                      <Check className="h-3.5 w-3.5 shrink-0 text-sage" strokeWidth={3} />
                      <span className="text-navy">Termos aceitos</span>
                    </>
                  ) : (
                    "Precisa aceitar os Termos de Uso"
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setTermosAbertos(true)}
                  className="shrink-0 rounded-full border border-cream-line px-3 py-1 text-xs font-semibold text-navy hover:border-amber"
                >
                  {termosAceitos ? "Rever" : "Ler termos"}
                </button>
              </div>
            )}

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
                disabled={enviando || (!jaLogado && !termosAceitos)}
                className="flex-1 rounded-full bg-amber py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>

      <TermosModal
        open={termosAbertos}
        onOpenChange={setTermosAbertos}
        publico="familias"
        onAceitar={() => {
          setTermosAceitos(true);
          setTermosAbertos(false);
        }}
      />
    </Dialog>
  );
}
