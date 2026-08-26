"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button aria-label="Abrir menu" className="rounded-full p-1.5 text-navy md:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 border-none bg-navy p-6 text-white">
        <div className="mt-6 flex flex-col gap-5">
          <SheetClose asChild>
            <a href="#rota" className="text-base text-white/85">Como funciona</a>
          </SheetClose>
          <SheetClose asChild>
            <a href="#quem-somos" className="text-base text-white/85">Quem somos</a>
          </SheetClose>
          <SheetClose asChild>
            <a href="#motoristas" className="text-base text-white/85">Para motoristas</a>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/entrar" className="text-base text-white/85">Entrar</Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/pai"
              className="rounded-full bg-amber px-5 py-2.5 text-center text-sm font-bold text-navy"
            >
              Buscar transporte
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
