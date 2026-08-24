import { getSession } from "../../lib/auth";
import LogoutButton from "../../components/logout-button";

export default async function PaiLayout({ children }: { children: React.ReactNode }) {
  // /pai é pública (busca sem cadastro); /pai/dashboard exige sessão (ver middleware.ts)
  const session = await getSession();
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-serif text-xl text-navy">levva<span className="text-amber">.</span></span>
          <nav className="flex items-center gap-6 text-sm text-ink-soft">
            <a href="/pai">Buscar</a>
            <a href="/pai/dashboard">Minhas solicitações</a>
            {session && <LogoutButton className="text-sm text-ink-soft hover:text-navy" />}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
