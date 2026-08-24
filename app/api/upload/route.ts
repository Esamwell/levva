import { NextResponse } from "next/server";
import { salvarArquivo } from "../../../lib/storage";

const CATEGORIAS_VALIDAS = ["cnh", "curso-transporte", "antecedentes", "crlv"];

/**
 * POST /api/upload — multipart/form-data com campos "file" e "categoria".
 * Usado pelo cadastro de motorista pra subir os documentos exigidos
 * antes da verificação do admin.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const categoria = form.get("categoria");

  if (!(file instanceof File) || typeof categoria !== "string") {
    return NextResponse.json({ error: "Envie 'file' e 'categoria'." }, { status: 400 });
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  try {
    const { url } = await salvarArquivo(file, categoria);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha no upload." },
      { status: 400 }
    );
  }
}
