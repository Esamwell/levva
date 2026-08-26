"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/pai", label: "Buscar" },
  { href: "/pai/dashboard", label: "Solicitações" },
];

export function PaiNav() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition",
            pathname === link.href ? "text-navy" : "text-ink-soft hover:text-navy"
          )}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
