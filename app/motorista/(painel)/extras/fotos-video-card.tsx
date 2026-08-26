"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "../../../../components/ui/button";

const ASSUNTO = "Fotos e vídeo profissional pro meu perfil";
const MENSAGEM =
  "Quero saber mais sobre contratar fotos e vídeo profissional pro meu perfil na Mova. Meu perfil ainda não tem esse material.";

export default function FotosVideoCard() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function falarComSuporte() {
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assunto: ASSUNTO, mensagem: MENSAGEM }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não deu pra abrir o chamado.");
      router.push(`/motorista/suporte/${data.ticketId}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra abrir o chamado.");
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-navy">
        <Camera className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <p className="mt-3 font-serif text-lg text-navy">Fotos e vídeo profissional</p>
      <p className="mt-1 text-sm text-ink-soft">
        Sem fotos profissionais no seu perfil? Fale com a gente e a equipe Mova te ajuda a contratar.
      </p>

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      <Button
        size="sm"
        variant="outline"
        disabled={enviando}
        onClick={falarComSuporte}
        className="mt-4 border-cream-line text-ink-soft hover:bg-cream"
      >
        {enviando ? "Abrindo..." : "Falar com o suporte"}
      </Button>
    </div>
  );
}
