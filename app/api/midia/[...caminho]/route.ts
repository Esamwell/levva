import { NextResponse } from "next/server";
import { lerArquivo, categoriaEhPublica } from "../../../../lib/storage";

/**
 * GET /api/midia/:categoria/:arquivo — fotos e vídeo de perfil do motorista.
 * Ao contrário de /api/documentos (CNH, antecedentes: dado pessoal, exige
 * sessão), isso aqui é material que o motorista quer que a família veja —
 * público de propósito, sem checar quem está pedindo. Só serve categorias
 * marcadas como públicas em lib/storage.ts (categoriaEhPublica).
 */
const NAO_ENCONTRADO = () => NextResponse.json({ error: "Não encontrado." }, { status: 404 });

export async function GET(_req: Request, { params }: { params: Promise<{ caminho: string[] }> }) {
  const { caminho } = await params;
  if (caminho.length !== 2 || !categoriaEhPublica(caminho[0])) return NAO_ENCONTRADO();

  const arquivo = await lerArquivo(caminho);
  if (!arquivo) return NAO_ENCONTRADO();

  return new NextResponse(new Uint8Array(arquivo.buffer), {
    headers: {
      "Content-Type": arquivo.tipo,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      // Público e imutável (nome tem UUID) — pode cachear forte.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
