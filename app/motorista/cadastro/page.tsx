"use client";

/**
 * Cadastro público do motorista/transportador.
 *
 * Fluxo: quem clica em "Sou motorista" na landing cai aqui direto — ainda
 * sem conta. É aqui (e só aqui) que os valores dos planos aparecem, porque
 * não interessam ao pai que só quer buscar transporte pros filhos.
 *
 * Ao enviar: sobe os documentos (POST /api/upload), depois cria o
 * cadastro (POST /api/motoristas) com status PENDENTE, depois já dispara
 * o envio do código OTP e leva pra tela de confirmação — assim o
 * motorista sai daqui com a conta pronta pra acessar assim que o admin
 * aprovar os documentos.
 *
 * Escolas atendidas: aqui só usamos a *quantidade* pra calcular o plano.
 * A lista de escolas de fato (relação MotoristaEscola) é preenchida
 * depois, no painel do motorista já aprovado — evita um formulário
 * gigante logo de cara e mantém o cadastro rápido.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calcularPlanoSugerido,
  calcularMensalidade,
  PRECOS_PILOTO,
  type PlanoTipo,
} from "../../../lib/plano";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type Veiculo = { placa: string; modelo: string; capacidade: string };

type DocKey = "cnh" | "curso-transporte" | "antecedentes" | "crlv";
type DocState = Partial<Record<DocKey, { nome: string; url: string; enviando: boolean }>>;

const DOCS: { key: DocKey; label: string }[] = [
  { key: "cnh", label: "CNH categoria D ou E" },
  { key: "curso-transporte", label: "Certificado de curso de transporte escolar" },
  { key: "antecedentes", label: "Certidão de antecedentes criminais" },
  { key: "crlv", label: "Documento do veículo (CRLV)" },
];

const STEPS = ["Seus dados", "Veículo e rotina", "Documentos", "Revisão"] as const;

export default function CadastroMotoristaPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Etapa de confirmação de código (depois do cadastro criado)
  const [aguardandoCodigo, setAguardandoCodigo] = useState(false);
  const [codigo, setCodigo] = useState("");

  // Dados do motorista
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("Salvador");
  const [cnhNumero, setCnhNumero] = useState("");
  const [cnhCategoria, setCnhCategoria] = useState("D");

  // Veículo e rotina — o que define o plano
  const [numEscolas, setNumEscolas] = useState(1);
  const [destaque, setDestaque] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([
    { placa: "", modelo: "", capacidade: "" },
  ]);

  const [docs, setDocs] = useState<DocState>({});

  const numVeiculos = veiculos.length;

  const planoSugerido: PlanoTipo = useMemo(
    () => calcularPlanoSugerido({ numVeiculos, numEscolas }),
    [numVeiculos, numEscolas]
  );

  const mensalidade = useMemo(
    () =>
      calcularMensalidade({
        plano: planoSugerido,
        numVeiculos,
        destaque,
        tabela: PRECOS_PILOTO,
      }),
    [planoSugerido, numVeiculos, destaque]
  );

  function addVeiculo() {
    setVeiculos((v) => [...v, { placa: "", modelo: "", capacidade: "" }]);
  }
  function removeVeiculo(i: number) {
    setVeiculos((v) => v.filter((_, idx) => idx !== i));
  }
  function updateVeiculo(i: number, campo: keyof Veiculo, valor: string) {
    setVeiculos((v) => v.map((x, idx) => (idx === i ? { ...x, [campo]: valor } : x)));
  }

  async function handleUpload(key: DocKey, file: File) {
    setDocs((d) => ({ ...d, [key]: { nome: file.name, url: "", enviando: true } }));
    const form = new FormData();
    form.append("file", file);
    form.append("categoria", key);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload");
      setDocs((d) => ({ ...d, [key]: { nome: file.name, url: data.url, enviando: false } }));
    } catch (e) {
      setDocs((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
      setErro(e instanceof Error ? e.message : "Falha ao enviar documento.");
    }
  }

  const step0Ok = nome.trim().length > 2 && whatsapp.trim().length >= 10;
  const step1Ok = veiculos.every((v) => v.placa && v.modelo && v.capacidade);
  const step2Ok = cnhNumero.trim().length > 3 && DOCS.every((d) => docs[d.key]?.url);

  const podeAvancar = step === 0 ? step0Ok : step === 1 ? step1Ok : step === 2 ? step2Ok : true;

  async function enviarCadastro() {
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/motoristas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          telefone: whatsapp,
          cidade,
          cnhNumero,
          cnhCategoria,
          numEscolasInformado: numEscolas,
          destaqueDesejado: destaque,
          veiculos: veiculos.map((v) => ({
            placa: v.placa,
            modelo: v.modelo,
            capacidade: Number(v.capacidade),
          })),
          documentos: {
            cnhUrl: docs.cnh?.url,
            cursoUrl: docs["curso-transporte"]?.url,
            antecedentesUrl: docs.antecedentes?.url,
            crlvUrl: docs.crlv?.url,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível concluir o cadastro.");
      setAguardandoCodigo(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/confirmar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: whatsapp, codigo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido.");
      router.push("/motorista");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Código inválido.");
    } finally {
      setEnviando(false);
    }
  }

  if (aguardandoCodigo) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <a href="/" className="font-serif text-2xl text-navy">
            levva<span className="text-amber">.</span>
          </a>
          <div className="mt-8 rounded-card border border-cream-line bg-white p-8">
            <h1 className="font-serif text-2xl text-navy">Cadastro enviado!</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Mandamos um código de 6 dígitos pro seu WhatsApp {whatsapp}. Confirme
              pra já acessar seu painel — seus documentos ficam em análise até a
              aprovação da equipe Levva.
            </p>
            <form onSubmit={confirmarCodigo} className="mt-5 space-y-4">
              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border border-cream-line px-4 py-2.5 text-center font-mono text-lg tracking-[0.3em] outline-none focus:border-amber"
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <button
                disabled={enviando || codigo.length !== 6}
                className="w-full rounded-full bg-amber py-2.5 text-sm font-bold text-navy disabled:opacity-50"
              >
                {enviando ? "Confirmando..." : "Confirmar e acessar meu painel"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-line bg-navy px-6 py-5 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/" className="font-serif text-xl">
            levva<span className="text-amber">.</span>
          </a>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">
            Cadastro de motorista
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-serif text-3xl text-navy">Vamos cadastrar seu veículo.</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Leva uns 5 minutos. Depois de enviar, nossa equipe confere seus
          documentos e libera seu perfil pras famílias da sua região.
        </p>

        <ol className="mt-8 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={
                  "flex h-7 w-7 items-center justify-center rounded-full " +
                  (i === step
                    ? "bg-amber text-navy"
                    : i < step
                    ? "bg-sage text-white"
                    : "bg-cream-line text-ink-soft")
                }
              >
                {i + 1}
              </span>
              <span className={i === step ? "text-navy" : ""}>{label}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-cream-line" />}
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-card border border-cream-line bg-white p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-navy">
                  Seu nome completo
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Marcos Andrade"
                  className="w-full rounded-lg border border-cream-line px-4 py-2.5 outline-none focus:border-amber"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-navy">WhatsApp</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(71) 9xxxx-xxxx"
                  className="w-full rounded-lg border border-cream-line px-4 py-2.5 outline-none focus:border-amber"
                />
                <p className="mt-1 text-xs text-ink-soft">
                  É por aqui que os leads de famílias interessadas chegam até você
                  — e também como você entra no seu painel depois.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-navy">Cidade</label>
                <select
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full rounded-lg border border-cream-line px-4 py-2.5 outline-none focus:border-amber"
                >
                  <option>Salvador</option>
                  <option>Lauro de Freitas</option>
                  <option>Camaçari</option>
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-navy">Seus veículos</label>
                  <button
                    type="button"
                    onClick={addVeiculo}
                    className="text-xs font-semibold text-sage"
                  >
                    + adicionar veículo
                  </button>
                </div>
                <div className="space-y-3">
                  {veiculos.map((v, i) => (
                    <div key={i} className="rounded-lg border border-cream-line p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink-soft">
                          Veículo {i + 1}
                        </span>
                        {veiculos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVeiculo(i)}
                            className="text-xs text-red-500"
                          >
                            remover
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          value={v.placa}
                          onChange={(e) => updateVeiculo(i, "placa", e.target.value.toUpperCase())}
                          placeholder="Placa"
                          className="rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber"
                        />
                        <input
                          value={v.modelo}
                          onChange={(e) => updateVeiculo(i, "modelo", e.target.value)}
                          placeholder="Modelo (ex.: Fiat Ducato)"
                          className="col-span-2 rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber"
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={v.capacidade}
                        onChange={(e) => updateVeiculo(i, "capacidade", e.target.value)}
                        placeholder="Capacidade (nº de crianças)"
                        className="mt-2 w-full rounded-lg border border-cream-line px-3 py-2 text-sm outline-none focus:border-amber"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-navy">
                  Quantas escolas diferentes você atende hoje?
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNumEscolas((n) => Math.max(1, n - 1))}
                    className="h-9 w-9 rounded-full border border-cream-line text-lg text-navy"
                  >
                    –
                  </button>
                  <span className="w-8 text-center font-mono text-lg">{numEscolas}</span>
                  <button
                    type="button"
                    onClick={() => setNumEscolas((n) => Math.min(20, n + 1))}
                    className="h-9 w-9 rounded-full border border-cream-line text-lg text-navy"
                  >
                    +
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  Só usamos isso pra calcular seu plano. Você confirma o nome de
                  cada escola depois, já no seu painel.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-cream-line px-4 py-3">
                <input
                  type="checkbox"
                  checked={destaque}
                  onChange={(e) => setDestaque(e.target.checked)}
                  className="h-4 w-4 accent-amber"
                />
                <span className="text-sm text-ink-soft">
                  Quero aparecer em destaque nos resultados de busca (+
                  {formatarReais(PRECOS_PILOTO.DESTAQUE)}/mês)
                </span>
              </label>

              <div className="rounded-card bg-navy px-6 py-5 text-white">
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Seu plano sugerido
                </p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-serif text-2xl">
                    {planoSugerido === "BASICO" ? "Básico" : "Frota"}
                  </span>
                  <span className="font-mono text-xl text-amber">
                    {formatarReais(mensalidade)}
                    <span className="text-sm text-white/60">/mês</span>
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Preço de fundador — válido nos 2 primeiros meses de operação na
                  sua região. Sem comissão por lead.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-navy">
                    Número da CNH
                  </label>
                  <input
                    value={cnhNumero}
                    onChange={(e) => setCnhNumero(e.target.value)}
                    className="w-full rounded-lg border border-cream-line px-3 py-2.5 text-sm outline-none focus:border-amber"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-navy">
                    Categoria
                  </label>
                  <select
                    value={cnhCategoria}
                    onChange={(e) => setCnhCategoria(e.target.value)}
                    className="w-full rounded-lg border border-cream-line px-3 py-2.5 text-sm outline-none focus:border-amber"
                  >
                    <option>D</option>
                    <option>E</option>
                  </select>
                </div>
              </div>

              {DOCS.map(({ key, label }) => {
                const doc = docs[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-dashed border-cream-line px-4 py-3"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="block truncate text-sm text-ink-soft">{label}</span>
                      {doc?.url && (
                        <span className="text-xs font-semibold text-sage">
                          ✓ {doc.nome}
                        </span>
                      )}
                      {doc?.enviando && (
                        <span className="text-xs text-ink-soft">Enviando...</span>
                      )}
                    </div>
                    <label className="shrink-0 cursor-pointer rounded-full bg-cream-line px-4 py-1.5 text-xs font-semibold text-navy">
                      {doc?.url ? "Trocar" : "Anexar"}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(key, file);
                        }}
                      />
                    </label>
                  </div>
                );
              })}
              <p className="text-xs text-ink-soft">
                Sem esses documentos aprovados, seu perfil não aparece pras
                famílias — é o que garante a confiança da plataforma.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl text-navy">Confere se está tudo certo:</h2>
              <dl className="divide-y divide-cream-line text-sm">
                <div className="flex justify-between py-2">
                  <dt className="text-ink-soft">Nome</dt>
                  <dd className="font-semibold text-navy">{nome || "—"}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-ink-soft">WhatsApp</dt>
                  <dd className="font-semibold text-navy">{whatsapp || "—"}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-ink-soft">Cidade</dt>
                  <dd className="font-semibold text-navy">{cidade}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-ink-soft">Veículos / escolas atendidas</dt>
                  <dd className="font-semibold text-navy">
                    {numVeiculos} / {numEscolas}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-ink-soft">Documentos</dt>
                  <dd className="font-semibold text-navy">
                    {DOCS.filter((d) => docs[d.key]?.url).length}/{DOCS.length} enviados
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-ink-soft">Plano</dt>
                  <dd className="font-semibold text-navy">
                    {planoSugerido === "BASICO" ? "Básico" : "Frota"} —{" "}
                    {formatarReais(mensalidade)}/mês
                  </dd>
                </div>
              </dl>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <p className="text-xs text-ink-soft">
                Ao enviar, você concorda em passar pela verificação documental
                da Levva antes de receber leads.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-soft disabled:opacity-0"
            >
              Voltar
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!podeAvancar}
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="rounded-full bg-amber px-6 py-2.5 text-sm font-bold text-navy disabled:opacity-40"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                disabled={enviando}
                onClick={enviarCadastro}
                className="rounded-full bg-amber px-6 py-2.5 text-sm font-bold text-navy disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar cadastro"}
              </button>
            )}
          </div>
        </div>

        <section className="mt-14">
          <h2 className="font-serif text-2xl text-navy">Tabela de planos</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Preço de fundador nos 2 primeiros meses de operação na sua região.
            Sem comissão por indicação — o valor é fixo, todo mês.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-card border border-cream-line bg-white p-5">
              <p className="text-sm font-semibold text-navy">Básico</p>
              <p className="mt-1 font-mono text-2xl text-navy">
                {formatarReais(PRECOS_PILOTO.BASICO)}
                <span className="text-sm text-ink-soft">/mês</span>
              </p>
              <p className="mt-2 text-xs text-ink-soft">1 veículo, até 2 escolas atendidas.</p>
            </div>
            <div className="rounded-card border-2 border-amber bg-white p-5">
              <p className="text-sm font-semibold text-navy">Frota</p>
              <p className="mt-1 font-mono text-2xl text-navy">
                {formatarReais(PRECOS_PILOTO.FROTA_BASE)}
                <span className="text-sm text-ink-soft">/mês</span>
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                +{formatarReais(PRECOS_PILOTO.FROTA_VEICULO_ADICIONAL)} por veículo
                adicional. Mais de 1 veículo ou 3+ escolas.
              </p>
            </div>
            <div className="rounded-card border border-cream-line bg-white p-5">
              <p className="text-sm font-semibold text-navy">Destaque</p>
              <p className="mt-1 font-mono text-2xl text-navy">
                +{formatarReais(PRECOS_PILOTO.DESTAQUE)}
                <span className="text-sm text-ink-soft">/mês</span>
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Add-on opcional. Prioridade nos resultados de busca dos pais.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
