import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const TICKET_STATUS_META = {
  ABERTO: { label: "Aguardando resposta", className: "bg-amber-soft text-navy" },
  RESPONDIDO: { label: "Respondido", className: "bg-sage-soft text-sage" },
  FECHADO: { label: "Encerrado", className: "bg-cream-line text-ink-soft" },
} as const;

export type TicketStatus = keyof typeof TICKET_STATUS_META;

export function TicketStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = TICKET_STATUS_META[status as TicketStatus] ?? { label: status, className: "bg-cream-line text-ink-soft" };
  return (
    <Badge variant="outline" className={cn("border-transparent font-semibold", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
