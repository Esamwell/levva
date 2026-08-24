"use client";

/**
 * Login sem senha: telefone -> código de 6 dígitos via WhatsApp -> sessão.
 * Usado tanto por pai quanto motorista quanto admin — o papel já está
 * gravado no User, então após confirmar o código a gente redireciona
 * pro painel certo (ou pro ?redirect= que o middleware.ts anexou).
 */

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function EntrarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect");

  const [etapa, setEtapa] = useState<"telefone" | "codigo">("telefone");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function solicitarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/solicitar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone }),
      });
      if (!res.ok) throw new Error();
      setEtapa("codigo");
    } catch {
      setErro("Não deu pra enviar o código. Confere o número e tenta de novo.");
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/confirmar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, codigo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Código inválido.");
        return;
      }
      const destino =
        redirect ||
        (data.role === "PAI" ? "/pai" : data.role === "MOTORISTA" ? "/motorista" : "/admin");
      router.push(destino);
      router.refresh();
    } catch {
      setErro("Algo deu errado. Tenta de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="font-serif text-2xl text-navy">
          levva<span className="text-amber">.</span>
        </a>

        <div className="mt-8 rounded-card border border-cream-line bg-white p-8">
          {etapa === "telefone" ? (
            <form onSubmit={solicitarCodigo} className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl text-navy">Entrar</h1>
                <p className="mt-1 text-sm text-ink-soft">
                  Sem senha. A gente manda um código pelo seu WhatsApp.
                </p>
              </div>
              <input
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(71) 9xxxx-xxxx"
                className="w-full rounded-lg border border-cream-line px-4 py-2.5 outline-none focus:border-amber"
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <button
                disabled={carregando}
                className="w-full rounded-full bg-amber py-2.5 text-sm font-bold text-navy disabled:opacity-50"
              >
                {carregando ? "Enviando..." : "Receber código"}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmarCodigo} className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl text-navy">Digite o código</h1>
                <p className="mt-1 text-sm text-ink-soft">
                  Mandamos um código de 6 dígitos pro WhatsApp {telefone}.
                </p>
              </div>
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
                disabled={carregando || codigo.length !== 6}
                className="w-full rounded-full bg-amber py-2.5 text-sm font-bold text-navy disabled:opacity-50"
              >
                {carregando ? "Confirmando..." : "Confirmar e entrar"}
              </button>
              <button
                type="button"
                onClick={() => setEtapa("telefone")}
                className="w-full text-center text-xs text-ink-soft"
              >
                Errei o número, voltar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}
