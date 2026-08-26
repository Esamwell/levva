import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "../../components/logo";
import { TERMOS_VERSAO_ATUAL } from "../../lib/termos";
import { TERMOS_MOTORISTA, TERMOS_FAMILIAS } from "../../lib/termos-conteudo";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-line bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Site
          </Link>
          <Logo on="light" size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-serif text-4xl text-navy">Termos de Uso</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Versão {TERMOS_VERSAO_ATUAL} · válida a partir de 26 de agosto de 2026
        </p>

        <section id="motoristas" className="mt-10 scroll-mt-20">
          <h2 className="font-serif text-2xl text-navy">Para motoristas e transportadores</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft">
            {TERMOS_MOTORISTA.map((c) => (
              <p key={c.titulo}>
                <strong className="text-navy">{c.titulo}</strong> {c.texto}
              </p>
            ))}
          </div>
        </section>

        <section id="familias" className="mt-12 scroll-mt-20 border-t border-cream-line pt-10">
          <h2 className="font-serif text-2xl text-navy">Para famílias (pais e responsáveis)</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft">
            {TERMOS_FAMILIAS.map((c) => (
              <p key={c.titulo}>
                <strong className="text-navy">{c.titulo}</strong> {c.texto}
              </p>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
