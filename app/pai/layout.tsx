import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "../../lib/auth";
import { db } from "../../lib/db";
import LogoutButton from "../../components/logout-button";
import { PaiNav } from "./pai-nav";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Logo } from "../../components/logo";

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function PaiLayout({ children }: { children: React.ReactNode }) {
  // /pai é pública (busca sem cadastro); /pai/dashboard exige sessão (ver middleware.ts)
  const session = await getSession();
  const user = session ? await db.user.findUnique({ where: { id: session.userId }, select: { nome: true } }) : null;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-line bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/"
              aria-label="Voltar ao site"
              className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Site</span>
            </Link>
            <span className="hidden h-5 w-px bg-cream-line sm:block" />
            <Logo on="light" size="sm" />
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <PaiNav />
            {user ? (
              <div className="flex items-center gap-2.5 border-l border-cream-line pl-3 sm:pl-6">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-sage-soft text-[11px] font-bold text-sage">
                    {iniciais(user.nome)}
                  </AvatarFallback>
                </Avatar>
                <LogoutButton className="text-sm text-ink-soft hover:text-navy" />
              </div>
            ) : (
              <Link
                href="/entrar"
                className="border-l border-cream-line pl-3 text-sm font-medium text-ink-soft hover:text-navy sm:pl-6"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
