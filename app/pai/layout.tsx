import { getSession } from "../../lib/auth";
import { db } from "../../lib/db";
import LogoutButton from "../../components/logout-button";
import { PaiNav } from "./pai-nav";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

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
      <header className="border-b border-cream-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-serif text-xl text-navy">
            levva<span className="text-amber">.</span>
          </span>
          <nav className="flex items-center gap-6">
            <PaiNav />
            {user && (
              <div className="flex items-center gap-2.5 border-l border-cream-line pl-6">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-sage-soft text-[11px] font-bold text-sage">
                    {iniciais(user.nome)}
                  </AvatarFallback>
                </Avatar>
                <LogoutButton className="text-sm text-ink-soft hover:text-navy" />
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
