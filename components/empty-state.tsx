import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-cream-line bg-white px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-ink-soft">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="mt-4 font-serif text-lg text-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && (
        <Link href={action.href} className="mt-5 text-sm font-semibold text-sage hover:underline">
          {action.label} →
        </Link>
      )}
    </div>
  );
}
