import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Marca da Mova: ícone (escudo+pin+ônibus, PNG com transparência) + wordmark
 * tipografado em Fredoka (fonte "serif" do tailwind.config.ts).
 *
 * O ícone tem contorno preto — em fundo escuro (a maioria dos headers do
 * app) ele precisa de uma base clara por trás pra não sumir. Em fundo claro
 * ele funciona liso, sem base.
 */
export function Logo({
  on = "dark",
  size = "md",
  href = "/",
  className,
}: {
  on?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}) {
  const iconBox = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";

  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg p-1",
          iconBox,
          on === "dark" && "bg-white"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mova-mark.png" alt="" className="h-full w-full object-contain" />
      </span>
      <span className={cn("font-serif font-semibold leading-none", textSize, on === "dark" ? "text-white" : "text-navy")}>
        mova
      </span>
    </Link>
  );
}
