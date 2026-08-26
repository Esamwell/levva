"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Wallet } from "lucide-react";
import { Button } from "../../../components/ui/button";

type Ambiente = "SANDBOX" | "PRODUCAO";

type Status = {
  configurado: boolean;
  ambiente: Ambiente;
  contaNome: string | null;
  contaEmail: string | null;
  testadoEm: string | null;
  atualizadoEm: string | null;
};

const PREFIXO_ESPERADO: Record<Ambiente, string> = {
  SANDBOX: "$aact_hmlg_",
  PRODUCAO: "$aact_prod_",
};

const campo = "w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm outline-none focus:border-amber";

export default function ConfiguracoesAsaasForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [carregandoStatus, setCarregandoStatus] = useState(true);

  const [apiKey, setApiKey] = useState("");
  const [ambiente, setAmbiente] = useState<Ambiente>("SANDBOX");
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [configurandoWebhook, setConfigurandoWebhook] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function carregarStatus() {
    setCarregandoStatus(true);
    try {
      const res = await fetch("/api/admin/configuracoes/asaas");
      const data = await res.json();
      setStatus(data);
      setAmbiente(data.ambiente);
    } finally {
      setCarregandoStatus(false);
    }
  }

  useEffect(() => {
    carregarStatus();
  }, []);

  const prefixoDiverge = apiKey.trim().length > 0 && !apiKey.trim().startsWith(PREFIXO_ESPERADO[ambiente]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/configuracoes/asaas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiKey.trim() ? { apiKey: apiKey.trim(), ambiente } : { ambiente }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não deu pra salvar.");
      setApiKey("");
      setMensagem({ tipo: "ok", texto: "Salvo. Testa a conexão pra confirmar que a chave está certa." });
      await carregarStatus();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err instanceof Error ? err.message : "Não deu pra salvar." });
    } finally {
      setSalvando(false);
    }
  }

  async function testar() {
    setMensagem(null);
    setTestando(true);
    try {
      const res = await fetch("/api/admin/configuracoes/asaas/testar", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao testar.");
      setMensagem({ tipo: "ok", texto: `Conectado como "${data.nome}"${data.email ? ` (${data.email})` : ""}.` });
      await carregarStatus();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err instanceof Error ? err.message : "Falha ao testar." });
    } finally {
      setTestando(false);
    }
  }

  async function configurarWebhook() {
    setMensagem(null);
    setConfigurandoWebhook(true);
    try {
      const res = await fetch("/api/admin/configuracoes/asaas/webhook", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao configurar o webhook.");
      setMensagem({ tipo: "ok", texto: "Webhook registrado — pagamentos confirmados agora avisam o sistema automaticamente." });
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err instanceof Error ? err.message : "Falha ao configurar o webhook." });
    } finally {
      setConfigurandoWebhook(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-cream-line bg-white p-5">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-ink-soft" />
          <h2 className="font-serif text-lg text-navy">Asaas</h2>
        </div>

        {carregandoStatus ? (
          <p className="mt-3 text-sm text-ink-soft">Carregando...</p>
        ) : status?.configurado ? (
          <div className="mt-3 space-y-1.5 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-sage">
              <CheckCircle2 className="h-4 w-4" /> Chave configurada
              <span className="ml-1 rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                {status.ambiente === "PRODUCAO" ? "Produção" : "Sandbox"}
              </span>
            </p>
            {status.contaNome ? (
              <p className="text-ink-soft">
                Última conexão testada: <span className="font-medium text-navy">{status.contaNome}</span>
                {status.contaEmail && ` · ${status.contaEmail}`}
                {status.testadoEm && ` · ${new Date(status.testadoEm).toLocaleString("pt-BR")}`}
              </p>
            ) : (
              <p className="text-ink-soft">Ainda não testada — clica em &quot;Testar conexão&quot; abaixo.</p>
            )}
          </div>
        ) : (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-red-600">
            <XCircle className="h-4 w-4" /> Nenhuma chave configurada ainda
          </p>
        )}
      </section>

      <form onSubmit={salvar} className="space-y-3 rounded-2xl border border-cream-line bg-white p-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Ambiente</label>
          <select value={ambiente} onChange={(e) => setAmbiente(e.target.value as Ambiente)} className={campo}>
            <option value="SANDBOX">Sandbox (testes)</option>
            <option value="PRODUCAO">Produção</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Chave de API (access token)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={status?.configurado ? "•••••••••• (deixe em branco pra manter a atual)" : "$aact_..."}
            className={campo}
            autoComplete="off"
          />
          {prefixoDiverge && (
            <p className="mt-1.5 text-xs text-amber-700">
              Essa chave não começa com {PREFIXO_ESPERADO[ambiente]} — confere se é mesmo uma chave de{" "}
              {ambiente === "PRODUCAO" ? "produção" : "sandbox"}.
            </p>
          )}
          <p className="mt-1.5 text-xs text-ink-soft">
            Gerada em Asaas → Integrações → Chaves de API. O Asaas só mostra a chave uma vez na
            criação — se perder, precisa gerar outra.
          </p>
        </div>

        {mensagem && (
          <p className={`text-sm ${mensagem.tipo === "ok" ? "text-sage" : "text-red-600"}`}>{mensagem.texto}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button disabled={salvando} className="flex-1 bg-navy text-white hover:bg-navy/90">
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testando || !status?.configurado}
            onClick={testar}
            className="flex-1 border-cream-line text-navy hover:bg-cream"
          >
            {testando ? "Testando..." : "Testar conexão"}
          </Button>
        </div>
      </form>

      <section className="rounded-2xl border border-cream-line bg-white p-5">
        <h2 className="font-serif text-lg text-navy">Webhook de pagamentos</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Avisa o sistema automaticamente quando um pagamento é confirmado, pra liberar o repasse
          pro motorista. Registra direto na conta configurada acima — sem precisar mexer no painel
          do Asaas.
        </p>
        <Button
          type="button"
          disabled={configurandoWebhook || !status?.configurado}
          onClick={configurarWebhook}
          className="mt-3 bg-navy text-white hover:bg-navy/90"
        >
          {configurandoWebhook ? "Registrando..." : "Configurar webhook"}
        </Button>
      </section>
    </div>
  );
}
