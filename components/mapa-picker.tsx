"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/**
 * Mapa com um pino arrastável — usado em /admin/escolas pra escolher a
 * localização exata em vez de confiar só no geocoding automático (que já
 * falhou pra uma escola real em produção, ver commit da auditoria), e em
 * /motorista/perfil pra desenhar a área de atendimento (pino + círculo de
 * raio, igual segmentação de público do Meta Ads — ver AreaAtendimento).
 *
 * Leaflet mexe com `window`/`document` assim que importado, então o import
 * de verdade só acontece dentro do useEffect (client-only) — importar no
 * topo do arquivo quebraria a passada de SSR deste componente.
 */
export function MapaPicker({
  lat,
  lng,
  onMudar,
  raioKm,
}: {
  lat: number;
  lng: number;
  onMudar: (lat: number, lng: number) => void;
  /** Quando informado, desenha um círculo de raio (em km) em volta do pino. */
  raioKm?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const circuloRef = useRef<import("leaflet").Circle | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !containerRef.current || mapRef.current) return;

      const icone = L.divIcon({
        className: "",
        html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#FEDB1A;border:2px solid #111111;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
      });

      const map = L.map(containerRef.current).setView([lat, lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { icon: icone, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMudar(pos.lat, pos.lng);
      });
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        onMudar(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;

      if (raioKm) {
        const circulo = L.circle([lat, lng], {
          radius: raioKm * 1000,
          color: "#4A7A5E",
          fillColor: "#4A7A5E",
          fillOpacity: 0.12,
          weight: 2,
        }).addTo(map);
        circuloRef.current = circulo;
        map.fitBounds(circulo.getBounds(), { maxZoom: 14 });
      }
    })();

    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circuloRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lat/lng mudando de fora (escolheu uma sugestão no autocomplete) recentra
  // o mapa e move o pino sem recriar tudo — recriar o Leaflet a cada troca
  // de sugestão seria caro e pisca a tela.
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      circuloRef.current?.setLatLng([lat, lng]);
      if (circuloRef.current) {
        mapRef.current.fitBounds(circuloRef.current.getBounds(), { maxZoom: 14 });
      } else {
        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
      }
    }
  }, [lat, lng]);

  // Raio mudando (slider) só redesenha o círculo, sem recentrar o mapa —
  // arrastar o slider não deveria ficar saltando o zoom a cada pixel.
  useEffect(() => {
    if (circuloRef.current && raioKm) {
      circuloRef.current.setRadius(raioKm * 1000);
    }
  }, [raioKm]);

  return <div ref={containerRef} className="h-56 w-full rounded-xl border border-cream-line" />;
}
