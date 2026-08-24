"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/sair", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className={className ?? "text-sm text-white/75 hover:text-white"}
    >
      Sair
    </button>
  );
}
