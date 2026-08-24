"use client";

/**
 * Pedido de redefinição de senha.
 *
 * A tela mostra sempre a mesma confirmação, exista a conta ou não — é o
 * servidor que decide se manda o e-mail. Dizer "esse e-mail não está
 * cadastrado" entregaria quem usa a plataforma.
 */

import { useState } from "react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setCarregando(false);
      setEnviado(true);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <a href="/" className="font-serif text-2xl text-navy">
          levva<span className="text-amber">.</span>
        </a>

        <div className="mt-8 rounded-card border border-cream-line bg-white p-8">
          {enviado ? (
            <div>
              <h1 className="font-serif text-2xl text-navy">Confira seu e-mail</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Se existir uma conta com <strong className="text-navy">{email}</strong>, o link
                para escolher uma nova senha já está a caminho. Ele vale por 1 hora.
              </p>
              <a
                href="/entrar"
                className="mt-6 block rounded-full bg-amber py-2.5 text-center text-sm font-bold text-navy"
              >
                Voltar para o login
              </a>
            </div>
          ) : (
            <form onSubmit={pedir} className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl text-navy">Esqueci minha senha</h1>
                <p className="mt-1 text-sm text-ink-soft">
                  Informe seu e-mail e mandamos um link para você criar uma nova.
                </p>
              </div>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full rounded-lg border border-cream-line px-4 py-2.5 outline-none focus:border-amber"
              />
              <button
                disabled={carregando}
                className="w-full rounded-full bg-amber py-2.5 text-sm font-bold text-navy disabled:opacity-50"
              >
                {carregando ? "Enviando..." : "Enviar link"}
              </button>
              <a href="/entrar" className="block text-center text-xs text-ink-soft hover:text-navy">
                Lembrei a senha, voltar
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
