import LogoutButton from "../../../components/logout-button";

export default function MotoristaLayout({ children }: { children: React.ReactNode }) {
  // Sessão + papel já garantidos pelo middleware.ts antes de chegar aqui.
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-line bg-navy px-6 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-serif text-xl">levva<span className="text-amber">.</span> motorista</span>
          <nav className="flex items-center gap-6 text-sm text-white/75">
            <a href="/motorista">Leads</a>
            <a href="/motorista/perfil">Meu perfil</a>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
