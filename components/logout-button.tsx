"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/sair", { method: "POST" });
        // Limpa o cache de páginas do service worker — sem isso, num
        // aparelho compartilhado, a última tela autenticada em cache
        // continuava acessível offline pro próximo usuário do navegador.
        navigator.serviceWorker?.controller?.postMessage("LIMPAR_CACHE_PAGINAS");
        router.push("/");
        router.refresh();
      }}
      className={className ?? "text-sm text-white/75 hover:text-white"}
    >
      Sair
    </button>
  );
}
