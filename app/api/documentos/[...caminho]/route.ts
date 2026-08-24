import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { lerArquivo } from "../../../../lib/storage";

/**
 * GET /api/documentos/:categoria/:arquivo
 *
 * Única porta de saída dos documentos do motorista. Antes deste arquivo
 * existir, CNH e certidão de antecedentes ficavam em public/uploads e
 * qualquer pessoa com o link abria — sem sessão, sem papel, sem nada.
 *
 * Quem pode ver o quê:
 *   ADMIN     — qualquer documento (é o trabalho dele conferir).
 *   MOTORISTA — apenas os próprios documentos.
 *   Resto     — nada.
 *
 * Respondemos 404 (e não 403) para acesso negado: confirmar que o arquivo
 * existe já entrega informação sobre quem se cadastrou na plataforma.
 */

const NAO_ENCONTRADO = () =>
  NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caminho: string[] }> }
) {
  const session = await getSession();
  if (!session) return NAO_ENCONTRADO();

  const { caminho } = await params;
  const url = `/api/documentos/${caminho.join("/")}`;

  if (session.role === "MOTORISTA") {
    const motorista = await db.motorista.findUnique({
      where: { userId: session.userId },
      select: {
        fotoRosto: true,
        cnhDocUrl: true,
        cursoDocUrl: true,
        antecedentesDocUrl: true,
        veiculos: { select: { fotoUrl: true } },
      },
    });
    if (!motorista) return NAO_ENCONTRADO();

    const proprios = new Set(
      [
        motorista.fotoRosto,
        motorista.cnhDocUrl,
        motorista.cursoDocUrl,
        motorista.antecedentesDocUrl,
        ...motorista.veiculos.map((v) => v.fotoUrl),
      ].filter((u): u is string => Boolean(u))
    );

    if (!proprios.has(url)) return NAO_ENCONTRADO();
  } else if (session.role !== "ADMIN") {
    return NAO_ENCONTRADO();
  }

  const arquivo = await lerArquivo(caminho);
  if (!arquivo) return NAO_ENCONTRADO();

  return new NextResponse(new Uint8Array(arquivo.buffer), {
    headers: {
      "Content-Type": arquivo.tipo,
      // inline pra abrir na aba; nosniff porque o navegador não deve
      // adivinhar o tipo de um arquivo que veio de fora.
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      // Documento pessoal não entra em cache compartilhado.
      "Cache-Control": "private, no-store",
    },
  });
}
