/**
 * Sessão e papel ADMIN são garantidos pelo middleware.ts antes de chegar aqui,
 * e reconfirmados contra o banco por getSession() em cada página e rota.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C1730]">
      <header className="border-b border-white/10 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-mono text-sm tracking-widest text-amber-soft">LEVVA · ADMIN</span>
          <nav className="flex gap-6 text-sm text-white/70">
            <a href="/admin">Dashboard</a>
            <a href="/admin/aprovacoes">Aprovações</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 text-white">{children}</main>
    </div>
  );
}
