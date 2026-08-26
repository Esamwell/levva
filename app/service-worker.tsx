"use client";

import { useEffect } from "react";

/**
 * Registra o service worker só em produção — em dev ele mais atrapalha
 * (cache turvando o hot reload) do que ajuda.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Instalar sem PWA continua funcionando normalmente — não é crítico.
    });
  }, []);

  return null;
}
