import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-cream-line shadow-none">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <div className="font-mono text-2xl text-navy">{value}</div>
          <div className="mt-1 text-xs text-ink-soft">{label}</div>
          {hint && <div className="mt-2 text-xs font-medium text-sage">{hint}</div>}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-soft/40 text-navy">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </CardContent>
    </Card>
  );
}
