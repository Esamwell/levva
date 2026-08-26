import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mova — Transporte escolar verificado",
    short_name: "Mova",
    description:
      "A Mova conecta famílias a transportadores escolares 100% verificados em Salvador e Lauro de Freitas.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FEDB1A",
    lang: "pt-BR",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
