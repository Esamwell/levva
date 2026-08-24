"use client";

/**
 * Escolha da nova senha, a partir do link recebido por e-mail.
 * O token vem na query string e é usado uma única vez.
 */

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "../../components/auth-shell";
import { Button } from "../../components/ui/button";

function RedefinirForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  // Mesma regra que o servidor aplica — conferir aqui só evita ida e volta.
  const curta = senha.length > 0 && senha.length < 8;
  const semNumero = senha.length >= 8 && !/[0-9]/.test(senha);
  const semLetra = senha.length >= 8 && !/[a-zA-Z]/.test(senha);
  const diferentes = confirmacao.length > 0 && senha !== confirmacao;
  const podeEnviar = senha.length >= 8 && !semNumero && !semLetra && !diferentes && !!token;

  async function redefinir(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/redefinir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível redefinir a senha.");
        return;
      }
      setPronto(true);
    } catch {
      setErro("Algo deu errado. Tenta de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell>
      <div className="rounded-card border border-cream-line bg-white p-8">
        {!token ? (
          <div>
            <h1 className="font-serif text-2xl text-navy">Link incompleto</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Abra o link direto do e-mail que você recebeu, sem copiar pela metade.
            </p>
            <a
              href="/recuperar-senha"
              className="mt-6 block rounded-full bg-amber py-2.5 text-center text-sm font-bold text-navy"
            >
              Pedir um link novo
            </a>
          </div>
        ) : pronto ? (
          <div>
            <h1 className="font-serif text-2xl text-navy">Senha alterada</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Pronto. Por segurança, encerramos as outras sessões abertas nessa conta —
              entre de novo com a senha nova.
            </p>
            <Button onClick={() => router.push("/entrar")} className="mt-6 w-full bg-amber text-navy hover:bg-amber/90">
              Ir para o login
            </Button>
          </div>
        ) : (
          <form onSubmit={redefinir} className="space-y-4">
            <div>
              <h1 className="font-serif text-2xl text-navy">Nova senha</h1>
              <p className="mt-1 text-sm text-ink-soft">
                Pelo menos 8 caracteres, com uma letra e um número.
              </p>
            </div>

            <div>
              <label htmlFor="senha" className="text-xs font-semibold text-ink-soft">
                Nova senha
              </label>
              <div className="relative mt-1">
                <input
                  id="senha"
                  required
                  type={mostrar ? "text" : "password"}
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-lg border border-cream-line px-4 py-2.5 pr-11 outline-none focus:border-amber"
                />
                <button
                  type="button"
                  onClick={() => setMostrar((v) => !v)}
                  aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-navy"
                >
                  {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {curta && <p className="mt-1 text-xs text-red-600">Mínimo de 8 caracteres.</p>}
              {semNumero && <p className="mt-1 text-xs text-red-600">Inclua pelo menos um número.</p>}
              {semLetra && <p className="mt-1 text-xs text-red-600">Inclua pelo menos uma letra.</p>}
            </div>

            <div>
              <label htmlFor="confirmacao" className="text-xs font-semibold text-ink-soft">
                Repita a senha
              </label>
              <input
                id="confirmacao"
                required
                type={mostrar ? "text" : "password"}
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                className="mt-1 w-full rounded-lg border border-cream-line px-4 py-2.5 outline-none focus:border-amber"
              />
              {diferentes && <p className="mt-1 text-xs text-red-600">As duas senhas não batem.</p>}
            </div>

            {erro && (
              <p role="alert" className="text-sm text-red-600">
                {erro}
              </p>
            )}

            <Button disabled={carregando || !podeEnviar} className="w-full bg-amber text-navy hover:bg-amber/90">
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirForm />
    </Suspense>
  );
}
