import { NextResponse } from "next/server";
import { salvarArquivo, CATEGORIAS_VALIDAS } from "../../../lib/storage";
import { getSession } from "../../../lib/auth";
import { db } from "../../../lib/db";

/**
 * POST /api/upload — multipart/form-data com os campos "file" e "categoria".
 *
 * Exige sessão de motorista. Antes desta checagem existir, a rota aceitava
 * arquivo de qualquer pessoa da internet, sem limite de quantidade: enchia
 * o disco da VPS e transformava o servidor em hospedagem de arquivo alheio.
 *
 * Por isso o cadastro cria a conta primeiro e sobe os documentos depois —
 * quando já existe sessão pra amarrar cada arquivo ao dono dele.
 *
 * O arquivo salvo é gravado direto no registro do motorista; o cliente não
 * precisa devolver a URL depois, e ninguém consegue apontar o documento de
 * um motorista para o cadastro de outro.
 */

/** Campo do Motorista que cada categoria preenche. */
const CAMPO_POR_CATEGORIA: Record<string, string> = {
  cnh: "cnhDocUrl",
  "curso-transporte": "cursoDocUrl",
  antecedentes: "antecedentesDocUrl",
  rosto: "fotoRosto",
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "MOTORISTA") {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil de motorista não encontrado." }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const file = form.get("file");
  const categoria = form.get("categoria");

  if (!(file instanceof File) || typeof categoria !== "string") {
    return NextResponse.json({ error: "Envie 'file' e 'categoria'." }, { status: 400 });
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  let url: string;
  try {
    ({ url } = await salvarArquivo(file, categoria));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha no upload." },
      { status: 400 }
    );
  }

  // O CRLV vale pelos veículos; as demais categorias são campos do motorista.
  if (categoria === "crlv") {
    await db.veiculo.updateMany({
      where: { motoristaId: motorista.id },
      data: { fotoUrl: url },
    });
  } else {
    const campo = CAMPO_POR_CATEGORIA[categoria];
    await db.motorista.update({
      where: { id: motorista.id },
      data: { [campo]: url },
    });
  }

  return NextResponse.json({ url }, { status: 201 });
}
