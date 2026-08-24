import Link from "next/link";
import { Check } from "lucide-react";

const BULLETS = [
  "Motoristas com CNH, curso e antecedentes verificados",
  "Sem custo pra família, sem comissão por indicação",
  "Suporte direto com quem transporta seu filho",
];

/**
 * Casca compartilhada das telas de autenticação (entrar, recuperar/redefinir
 * senha): painel de marca à esquerda em telas ≥md, formulário à direita.
 * Em mobile vira coluna única com o logo no topo.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream md:flex">
      <aside className="hidden flex-col justify-between bg-navy px-12 py-14 text-white md:flex md:w-[42%]">
        <Link href="/" className="font-serif text-2xl">
          levva<span className="text-amber">.</span>
        </Link>
        <div>
          <h2 className="max-w-xs font-serif text-3xl leading-tight">
            O trajeto mais importante do dia, em boas mãos.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-white/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber" strokeWidth={2.5} />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-xs text-white/40">Salvador &amp; Lauro de Freitas</p>
      </aside>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="font-serif text-2xl text-navy md:hidden">
            levva<span className="text-amber">.</span>
          </Link>
          <div className="md:mt-0 mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
