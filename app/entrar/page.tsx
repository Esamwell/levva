"use client";

/**
 * Login único para os três papéis: e-mail e senha.
 *
 * Não existe "entrar como pai" ou "entrar como admin" — o papel já está
 * gravado no User, então depois de autenticar o servidor diz para onde ir.
 * Uma tela só evita que alguém descubra o tipo de uma conta testando a
 * porta errada, e o middleware garante que ninguém entre em painel de
 * outro papel forçando a URL.
 */

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "../../components/auth-shell";
import { Button } from "../../components/ui/button";

function EntrarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível entrar.");
        return;
      }
      router.push(redirect || data.destino);
      router.refresh();
    } catch {
      setErro("Algo deu errado. Tenta de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell>
      <div className="rounded-card border border-cream-line bg-white p-8">
        <form onSubmit={entrar} className="space-y-4">
          <div>
            <h1 className="font-serif text-2xl text-navy">Entrar</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Use o e-mail e a senha que você cadastrou.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-semibold text-ink-soft">
              E-mail
            </label>
            <input
              id="email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="mt-1 w-full rounded-lg border border-cream-line px-4 py-2.5 outline-none focus:border-amber"
            />
          </div>

          <div>
            <label htmlFor="senha" className="text-xs font-semibold text-ink-soft">
              Senha
            </label>
            <div className="relative mt-1">
              <input
                id="senha"
                required
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-cream-line px-4 py-2.5 pr-11 outline-none focus:border-amber"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-navy"
              >
                {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <Button disabled={carregando} className="w-full bg-amber text-navy hover:bg-amber/90">
            {carregando ? "Entrando..." : "Entrar"}
          </Button>

          <a
            href="/recuperar-senha"
            className="block text-center text-xs text-ink-soft hover:text-navy"
          >
            Esqueci minha senha
          </a>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        É motorista e ainda não tem conta?{" "}
        <a href="/motorista/cadastro" className="font-semibold text-sage">
          Cadastre-se
        </a>
      </p>
      <p className="mt-2 text-center text-sm text-ink-soft">
        Procurando transporte?{" "}
        <a href="/pai" className="font-semibold text-sage">
          Buscar sem cadastro
        </a>
      </p>
    </AuthShell>
  );
}

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}
