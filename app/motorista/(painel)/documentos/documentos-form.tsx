"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck, FileX, Upload, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";

type Categoria = "cnh" | "curso-transporte" | "antecedentes";

const DOCS: { categoria: Categoria; label: string }[] = [
  { categoria: "cnh", label: "CNH" },
  { categoria: "curso-transporte", label: "Curso de transporte escolar" },
  { categoria: "antecedentes", label: "Antecedentes criminais" },
];

function DocRow({
  categoria,
  label,
  urlAtual,
  statusAprovacao,
  onEnviado,
}: {
  categoria: Categoria;
  label: string;
  urlAtual: string | null;
  statusAprovacao: string;
  onEnviado: (categoria: Categoria, url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("categoria", categoria);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha no upload.");
      onEnviado(categoria, data.url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-line px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        {urlAtual ? <FileCheck className="h-4 w-4 text-sage" /> : <FileX className="h-4 w-4 text-ink-soft/50" />}
        <div>
          <p className="text-sm font-medium text-navy">{label}</p>
          {urlAtual ? (
            <a href={urlAtual} target="_blank" rel="noreferrer" className="text-xs text-sage hover:underline">
              Ver documento enviado
            </a>
          ) : (
            <p className="text-xs text-ink-soft/70">Não enviado</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {erro && <p className="text-xs text-red-600">{erro}</p>}
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-cream-line px-3.5 py-2 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy">
          {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {enviando ? "Enviando..." : urlAtual ? "Substituir" : "Enviar"}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={onEscolher}
            disabled={enviando}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

export default function DocumentosForm({
  documentos,
  statusAprovacao,
}: {
  documentos: Record<Categoria, string | null>;
  statusAprovacao: string;
}) {
  const router = useRouter();
  const [urls, setUrls] = useState(documentos);
  const [avisoReanalise, setAvisoReanalise] = useState(false);

  function onEnviado(categoria: Categoria, url: string) {
    setUrls((prev) => ({ ...prev, [categoria]: url }));
    if (statusAprovacao !== "PENDENTE") setAvisoReanalise(true);
    router.refresh();
  }

  return (
    <Card className="mt-6 max-w-lg border-cream-line shadow-none">
      <CardContent className="space-y-3 p-6">
        {avisoReanalise && (
          <div className="rounded-xl border border-amber bg-amber-soft/30 px-4 py-3 text-sm text-navy">
            Documento atualizado — seu cadastro volta pra fila de análise da equipe Mova antes de continuar
            aparecendo nas buscas.
          </div>
        )}
        {DOCS.map((d) => (
          <DocRow
            key={d.categoria}
            categoria={d.categoria}
            label={d.label}
            urlAtual={urls[d.categoria]}
            statusAprovacao={statusAprovacao}
            onEnviado={onEnviado}
          />
        ))}
      </CardContent>
    </Card>
  );
}
