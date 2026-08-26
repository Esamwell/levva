"use client";

import { useRef, useState } from "react";
import { MapPin } from "lucide-react";

export type PontoEndereco = { lat: number; lng: number };
type Sugestao = { label: string; lat: number; lng: number };

/**
 * Input de endereço com sugestão ao digitar (Photon, via /api/sugestoes-endereco)
 * — mesmo esquema usado em /admin/escolas, adaptado pra uso público (sem
 * mapa, só o texto + lat/lng de quem escolheu uma sugestão da lista).
 *
 * Digitar manualmente sem escolher uma sugestão invalida o ponto (onPonto(null))
 * — o texto ainda é usado na busca, só sem o atalho de pular o geocoding
 * no servidor.
 */
export function EnderecoAutocomplete({
  value,
  onChangeText,
  onPonto,
  placeholder,
  className,
}: {
  value: string;
  onChangeText: (texto: string) => void;
  onPonto: (ponto: PontoEndereco | null) => void;
  placeholder?: string;
  className: string;
}) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function digitar(texto: string) {
    onChangeText(texto);
    onPonto(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (texto.trim().length < 3) {
      setSugestoes([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/sugestoes-endereco?q=${encodeURIComponent(texto)}`);
        const data = await res.json();
        setSugestoes(data.sugestoes ?? []);
      } finally {
        setBuscando(false);
      }
    }, 400);
  }

  function escolher(s: Sugestao) {
    onChangeText(s.label);
    onPonto({ lat: s.lat, lng: s.lng });
    setSugestoes([]);
  }

  return (
    <div className="relative">
      <input
        required
        value={value}
        onChange={(e) => digitar(e.target.value)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {(sugestoes.length > 0 || buscando) && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-cream-line bg-white shadow-lg">
          {buscando && <p className="px-4 py-2 text-xs text-ink-soft">Buscando...</p>}
          {sugestoes.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => escolher(s)}
              className="flex w-full items-start gap-2 px-4 py-2 text-left text-sm hover:bg-cream"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
