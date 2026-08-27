"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/** Grade de fotos do perfil público — clicar abre em tamanho grande, com setas pra navegar. */
export function FotoGaleria({ fotos }: { fotos: string[] }) {
  const [aberta, setAberta] = useState<number | null>(null);

  if (fotos.length === 0) return null;

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {fotos.map((foto, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAberta(i)}
            className="aspect-square overflow-hidden rounded-xl border border-cream-line"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt="" className="h-full w-full object-cover transition hover:scale-105" />
          </button>
        ))}
      </div>

      {aberta !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAberta(null)}
        >
          <button
            type="button"
            onClick={() => setAberta(null)}
            className="absolute right-4 top-4 text-white/80 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-7 w-7" />
          </button>

          {aberta > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAberta((a) => (a !== null && a > 0 ? a - 1 : a));
              }}
              className="absolute left-2 text-white/80 hover:text-white sm:left-4"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          {aberta < fotos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAberta((a) => (a !== null && a < fotos.length - 1 ? a + 1 : a));
              }}
              className="absolute right-2 text-white/80 hover:text-white sm:right-4"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[aberta]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
