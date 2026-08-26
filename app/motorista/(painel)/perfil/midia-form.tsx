"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Video, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardTitle } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";

async function upload(file: File, categoria: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("categoria", categoria);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Falha no upload.");
  return data.url as string;
}

export default function MidiaForm({
  fotos: fotosIniciais,
  videoUrl: videoUrlInicial,
}: {
  fotos: string[];
  videoUrl: string | null;
}) {
  const router = useRouter();
  const [fotos, setFotos] = useState(fotosIniciais);
  const [videoUrl, setVideoUrl] = useState(videoUrlInicial);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [enviandoVideo, setEnviandoVideo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function onEscolherFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setErro(null);
    setEnviandoFotos(true);
    try {
      for (const file of files) {
        const url = await upload(file, "galeria");
        setFotos((prev) => [...prev, url]);
      }
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu pra enviar a foto.");
    } finally {
      setEnviandoFotos(false);
      if (fotoInputRef.current) fotoInputRef.current.value = "";
    }
  }

  async function removerFoto(url: string) {
    setFotos((prev) => prev.filter((f) => f !== url));
    try {
      await fetch("/api/motorista/galeria", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      router.refresh();
    } catch {
      setErro("Não deu pra remover. Tenta de novo.");
      setFotos((prev) => [...prev, url]);
    }
  }

  async function onEscolherVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setEnviandoVideo(true);
    try {
      const url = await upload(file, "video");
      setVideoUrl(url);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não deu pra enviar o vídeo.");
    } finally {
      setEnviandoVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  async function removerVideo() {
    const anterior = videoUrl;
    setVideoUrl(null);
    try {
      await fetch("/api/motorista/video", { method: "DELETE" });
      router.refresh();
    } catch {
      setErro("Não deu pra remover. Tenta de novo.");
      setVideoUrl(anterior);
    }
  }

  return (
    <Card className="mt-6 max-w-lg border-cream-line shadow-none">
      <CardContent className="space-y-6 p-6">
        <section className="space-y-3">
          <CardTitle className="text-sm uppercase tracking-wide text-ink-soft">Fotos do seu perfil</CardTitle>
          <p className="text-xs text-ink-soft">
            Fotos da van e suas ajudam a família a decidir. Diferente de CNH e antecedentes, essas aparecem no seu
            perfil público.
          </p>

          {fotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-cream-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removerFoto(url)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Remover foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-cream-line px-4 py-2 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy">
            {enviandoFotos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {enviandoFotos ? "Enviando..." : "Adicionar fotos"}
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={onEscolherFotos}
              disabled={enviandoFotos}
              className="hidden"
            />
          </label>
        </section>

        <Separator className="bg-cream-line" />

        <section className="space-y-3">
          <CardTitle className="text-sm uppercase tracking-wide text-ink-soft">Vídeo de apresentação</CardTitle>
          <p className="text-xs text-ink-soft">Um vídeo curto seu ou da van (até 40MB).</p>

          {videoUrl ? (
            <div className="space-y-2">
              <video src={videoUrl} controls className="w-full rounded-xl border border-cream-line" />
              <button
                type="button"
                onClick={removerVideo}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
              >
                <X className="h-3.5 w-3.5" /> Remover vídeo
              </button>
            </div>
          ) : (
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-cream-line px-4 py-2 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy">
              {enviandoVideo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
              {enviandoVideo ? "Enviando..." : "Adicionar vídeo"}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4"
                onChange={onEscolherVideo}
                disabled={enviandoVideo}
                className="hidden"
              />
            </label>
          )}
        </section>

        {erro && <p className="text-xs text-red-600">{erro}</p>}
      </CardContent>
    </Card>
  );
}
