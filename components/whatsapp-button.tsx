import { Phone, Lock } from "lucide-react";
import { mascararTelefone } from "../lib/texto";

/**
 * WhatsApp de pai/motorista só libera de verdade depois que a primeira
 * fatura do contrato é paga — antes disso mostra mascarado (só os 2
 * últimos dígitos), pra não incentivar combinar por fora e pular a
 * comissão da Mova. A conversa antes disso é pelo chat da própria Mova
 * (ver components/lead-thread.tsx).
 */
export function WhatsappButton({ telefone, liberado }: { telefone: string | null; liberado: boolean }) {
  if (!telefone) return null;

  if (!liberado) {
    return (
      <span
        title="Libera após o pagamento da primeira fatura"
        className="flex items-center gap-1.5 rounded-full border border-cream-line px-3 py-1.5 text-xs font-semibold text-ink-soft/70"
      >
        <Lock className="h-3.5 w-3.5" /> {mascararTelefone(telefone)}
      </span>
    );
  }

  const limpo = telefone.replace(/\D/g, "");
  return (
    <a
      href={`https://wa.me/${limpo}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 rounded-full border border-sage-soft px-3 py-1.5 text-xs font-semibold text-sage hover:bg-sage-soft/40"
    >
      <Phone className="h-3.5 w-3.5" /> WhatsApp
    </a>
  );
}
