import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Status de lead compartilhado entre pai/dashboard, motorista/leads e
 * admin — antes cada painel tinha seu próprio mapa (levemente divergente).
 */
export const STATUS_META = {
  AGUARDANDO: { label: "Aguardando repasse", className: "bg-cream-line text-ink-soft" },
  ENCAMINHADO: { label: "Encaminhado ao motorista", className: "bg-amber-soft text-navy" },
  EM_NEGOCIACAO: { label: "Em negociação", className: "bg-amber-soft text-navy" },
  FECHADO: { label: "Fechado", className: "bg-sage-soft text-sage" },
  NAO_FECHOU: { label: "Não fechou", className: "bg-red-50 text-red-600" },
} as const;

export type LeadStatus = keyof typeof STATUS_META;

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as LeadStatus] ?? { label: status, className: "bg-cream-line text-ink-soft" };
  return (
    <Badge variant="outline" className={cn("border-transparent font-semibold", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
