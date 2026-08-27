"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Wallet, Radio } from "lucide-react";
import { Button } from "../../../components/ui/button";

type Ambiente = "SANDBOX" | "PRODUCAO";

type StatusAmbiente = {
  ambiente: Ambiente;
  configurado: boolean;
  ativo: boolean;
  contaNome: string | null;
  contaEmail: string | null;
  testadoEm: string | null;
};

const PREFIXO_ESPERADO: Record<Ambiente, string> = {
  SANDBOX: "$aact_hmlg_",
  PRODUCAO: "$aact_prod_",
};

const LABEL: Record<Ambiente, string> = {
  SANDBOX: "Sandbox (testes)",
  PRODUCAO: "Produção",
};

const campo = "w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm outline-none focus:border-amber";

function CartaoAmbiente({
  status,
  onSalvo,
  onAtivado,
}: {
  status: StatusAmbiente;
  onSalvo: () => void;
  onAtivado: () => void;
}) {
  const { ambiente } = status;
  const [apiKey, setApiKey] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ativando, setAtivando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const prefixoDiverge = apiKey.trim().length > 0 && !apiKey.trim().startsWith(PREFIXO_ESPERADO[ambiente]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setMensagem(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/configuracoes/asaas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambiente, apiKey: apiKey.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra salvar.");
      setApiKey("");
      setMensagem({ tipo: "ok", texto: "Chave salva. Testa a conexão pra confirmar." });
      onSalvo();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err instanceof Error ? err.message : "Não deu pra salvar." });
    } finally {
      setSalvando(false);
    }
  }

  async function ativar() {
    setMensagem(null);
    setAtivando(true);
    try {
      const res = await fetch("/api/admin/configuracoes/asaas/ativar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambiente }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra ativar.");
      onAtivado();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err instanceof Error ? err.message : "Não deu pra ativar." });
    } finally {
      setAtivando(false);
    }
  }

  return (
    <section className={`rounded-2xl border p-5 ${status.ativo ? "border-navy bg-white" : "border-cream-line bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg text-navy">{LABEL[ambiente]}</h2>
        {status.ativo ? (
          <span className="flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-[11px] font-semibold text-white">
            <Radio className="h-3 w-3" /> Ativo agora
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={ativando || !status.configurado}
            onClick={ativar}
            className="h-7 rounded-full border-cream-line text-xs text-navy hover:bg-cream"
          >
            {ativando ? "Ativando..." : "Usar este ambiente"}
          </Button>
        )}
      </div>

      {status.configurado ? (
        <div className="mt-2 space-y-1 text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-sage">
            <CheckCircle2 className="h-3.5 w-3.5" /> Chave configurada
          </p>
          {status.contaNome ? (
            <p className="text-xs text-ink-soft">
              Última conexão testada: <span className="font-medium text-navy">{status.contaNome}</span>
              {status.contaEmail && ` · ${status.contaEmail}`}
              {status.testadoEm && ` · ${new Date(status.testadoEm).toLocaleString("pt-BR")}`}
            </p>
          ) : (
            <p className="text-xs text-ink-soft">Ainda não testada.</p>
          )}
        </div>
      ) : (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-red-600">
          <XCircle className="h-3.5 w-3.5" /> Nenhuma chave configurada
        </p>
      )}

      <form onSubmit={salvar} className="mt-3 space-y-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={status.configurado ? "•••••••••• (deixe em branco pra manter)" : `${PREFIXO_ESPERADO[ambiente]}...`}
          className={campo}
          autoComplete="off"
        />
        {prefixoDiverge && (
          <p className="text-xs text-amber-700">
            Essa chave não começa com {PREFIXO_ESPERADO[ambiente]}. Confere se é mesmo uma chave de{" "}
            {ambiente === "PRODUCAO" ? "produção" : "sandbox"}.
          </p>
        )}
        {mensagem && <p className={`text-xs ${mensagem.tipo === "ok" ? "text-sage" : "text-red-600"}`}>{mensagem.texto}</p>}
        <Button disabled={salvando || !apiKey.trim()} className="w-full bg-navy text-white hover:bg-navy/90">
          {salvando ? "Salvando..." : "Salvar chave"}
        </Button>
      </form>
    </section>
  );
}

export default function ConfiguracoesAsaasForm() {
  const [ambientes, setAmbientes] = useState<StatusAmbiente[] | null>(null);
  const [testando, setTestando] = useState(false);
  const [configurandoWebhook, setConfigurandoWebhook] = useState(false);
  const [mensagemGlobal, setMensagemGlobal] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function carregarStatus() {
    const res = await fetch("/api/admin/configuracoes/asaas");
    const data = await res.json();
    setAmbientes(data.ambientes ?? []);
  }

  useEffect(() => {
    carregarStatus();
  }, []);

  const ativo = ambientes?.find((a) => a.ativo) ?? null;

  async function testar() {
    setMensagemGlobal(null);
    setTestando(true);
    try {
      const res = await fetch("/api/admin/configuracoes/asaas/testar", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao testar.");
      setMensagemGlobal({ tipo: "ok", texto: `Conectado como "${data.nome}"${data.email ? ` (${data.email})` : ""}.` });
      await carregarStatus();
    } catch (err) {
      setMensagemGlobal({ tipo: "erro", texto: err instanceof Error ? err.message : "Falha ao testar." });
    } finally {
      setTestando(false);
    }
  }

  async function configurarWebhook() {
    setMensagemGlobal(null);
    setConfigurandoWebhook(true);
    try {
      const res = await fetch("/api/admin/configuracoes/asaas/webhook", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao configurar o webhook.");
      setMensagemGlobal({ tipo: "ok", texto: "Webhook registrado pro ambiente ativo." });
    } catch (err) {
      setMensagemGlobal({ tipo: "erro", texto: err instanceof Error ? err.message : "Falha ao configurar o webhook." });
    } finally {
      setConfigurandoWebhook(false);
    }
  }

  if (!ambientes) {
    return <p className="text-sm text-ink-soft">Carregando...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-ink-soft" />
        <h1 className="font-serif text-lg text-navy">Asaas</h1>
      </div>
      <p className="-mt-3 text-sm text-ink-soft">
        Cadastre as duas chaves (produção e sandbox) e escolha qual fica ativa. Trocar não pede a
        chave de novo, e toda cobrança gerada usa a chave do ambiente ativo agora.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {ambientes.map((status) => (
          <CartaoAmbiente
            key={status.ambiente}
            status={status}
            onSalvo={carregarStatus}
            onAtivado={carregarStatus}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-cream-line bg-white p-5">
        <h2 className="font-serif text-lg text-navy">Ambiente ativo: {ativo ? LABEL[ativo.ambiente] : "nenhum"}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Testar conexão e configurar webhook agem sobre o ambiente marcado como ativo acima.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={testando || !ativo?.configurado}
            onClick={testar}
            className="border-cream-line text-navy hover:bg-cream"
          >
            {testando ? "Testando..." : "Testar conexão"}
          </Button>
          <Button
            type="button"
            disabled={configurandoWebhook || !ativo?.configurado}
            onClick={configurarWebhook}
            className="bg-navy text-white hover:bg-navy/90"
          >
            {configurandoWebhook ? "Registrando..." : "Configurar webhook"}
          </Button>
        </div>
        {mensagemGlobal && (
          <p className={`mt-2 text-sm ${mensagemGlobal.tipo === "ok" ? "text-sage" : "text-red-600"}`}>
            {mensagemGlobal.texto}
          </p>
        )}
      </section>
    </div>
  );
}
